import Stripe from 'stripe';
import httpStatus from 'http-status';
import config from '../../config/config';
import { logger } from '../logger';
import { ApiError } from '../errors';
import { convertSnakeToCamelCase } from '../utils';

const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: '2023-08-16',
});

interface CustomerBody {
  email: string;
  name?: string;
}

interface PaymentMethodBody {
  tokenId: string;
  paymentMethodId: string;
}

interface SubscriptionBody {
  priceId: string;
  quantity: number;
  interval: string;
  isFreeAccess: boolean;
}

/**
 * Get customer by id
 * @param {string} id
 * @returns {Promise<Stripe.Customer | null>}
 */
export const getCustomerById = async (id: string): Promise<Stripe.Customer | null> => {
  try {
    const customer = await stripe.customers.retrieve(id);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Get customer by email
 * @param {string} email
 * @returns {Promise<Stripe.Customer | null>}
 */
export const getCustomerByEmail = async (email: string): Promise<Stripe.Customer | null> => {
  try {
    const customers = await stripe.customers.search({
      query: `email:'${email}'`,
    });

    return customers.data.length > 0 ? customers.data[0]! : null;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Create a customer
 * @param {CustomerBody} customerBody
 * @returns {Promise<Stripe.Customer>}
 */
export const createCustomer = async (customerBody: CustomerBody): Promise<Stripe.Customer> => {
  try {
    const existingCustomer = await getCustomerByEmail(customerBody.email);
    return existingCustomer ?? (await stripe.customers.create({ email: customerBody.email, name: customerBody.name ?? '' }));
  } catch (error: any) {
    logger.error(`Error creating customer: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Retrieves the default payment method of a customer.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Stripe.PaymentMethod | null>} - The default payment method or null if not set.
 */
export const getPaymentMethod = async (customerId: string): Promise<Stripe.PaymentMethod | null> => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !customer.invoice_settings?.default_payment_method) {
      return null;
    }
    const defaultPaymentMethodId = customer.invoice_settings.default_payment_method;
    if (typeof defaultPaymentMethodId === 'string') {
      const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

      return convertSnakeToCamelCase(paymentMethod);
    }

    return null;
  } catch (error: any) {
    logger.error(`Error fetching payment method: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Creates a new default payment method for a customer.
 * @param {string} customerId - The ID of the customer.
 * @param {PaymentMethodBody} body - Contains the payment method details.
 * @returns {Promise<void>} - Resolves when the payment method is created and set as default.
 */
export const createPaymentMethod = async (customerId: string, body: PaymentMethodBody): Promise<void> => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('No customer found.');
    }
    await stripe.customers.update(customer.id, { source: body.tokenId });
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: 'off_session',
      payment_method: body.paymentMethodId,
      payment_method_types: ['card'],
      confirm: true,
    });
    if (setupIntent.status === 'succeeded') {
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: body.paymentMethodId,
        },
      });
    }
  } catch (error: any) {
    logger.error(`Error creating payment method: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Updates a payment method's details.
 * @param {string} paymentMethodId - The ID of the payment method to update.
 * @param {Stripe.PaymentMethodUpdateParams} paymentMethod - The payment method parameters to update.
 * @returns {Promise<Stripe.PaymentMethod>} - The updated payment method object.
 */
export const updatePaymentMethod = async (
  paymentMethodId: string,
  paymentMethod: Stripe.PaymentMethodUpdateParams
): Promise<Stripe.PaymentMethod> => {
  try {
    const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodId, paymentMethod);
    return updatedPaymentMethod;
  } catch (error: any) {
    logger.error(`Error updating payment method with ID ${paymentMethodId}: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to update payment method: ${error.message}`);
  }
};

/**
 * Get subscription by id
 * @param {string} id
 * @returns {Promise<Stripe.Subscription>}
 */
export const getSubscriptionById = async (id: string): Promise<Stripe.Subscription | null> => {
  try {
    const subscription = await stripe.subscriptions.retrieve(id);

    if (subscription.status === 'active') {
      return subscription;
    }

    return null;
  } catch (error: any) {
    logger.error(`Error retrieving subscription: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to retrieve subscription or invoice.');
  }
};

export const createSubscription = async (customerId: string, body: SubscriptionBody) => {
  try {
    const paymentMethod = await getPaymentMethod(customerId);
    if (!body.isFreeAccess && !paymentMethod) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method not found');
    }
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: body.priceId,
          ...(body.interval !== 'month' ? { quantity: body.quantity } : {}),
        },
      ],
      ...(paymentMethod ? { default_payment_method: paymentMethod.id } : {}),
    });
    return subscription;
  } catch (error: any) {
    logger.error(`Error creating subscription: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Get customer invoices
 * @param customerId - The customer ID
 * @returns The customer's invoices
 */
/**
 * Get customer invoices
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Stripe.Invoice[] | null>}
 */
export const getInvoices = async (customerId: string): Promise<Stripe.Invoice[] | null> => {
  try {
    const { data: invoices } = await stripe.invoices.list({ customer: customerId });
    return invoices.length > 0 ? convertSnakeToCamelCase(invoices) : null;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Check invoices
 * @param {string} subscriptionId
 * @returns {Promise<boolean>}
 */
export const checkInvoices = async (subscriptionId: string): Promise<boolean> => {
  try {
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 10,
    });

    const isPaid = invoices.data.some((invoice) => invoice.status !== 'paid');

    return !isPaid;
  } catch (error: any) {
    logger.error(`Error retrieving invoices: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to retrieve invoices.');
  }
};

export const createUsageRecord = async (subscriptionId: string, quantity: number) => {
  try {
    const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.items.data.length === 0) {
      throw new Error('No subscription items found.');
    }

    const subscriptionItemId = subscription.items.data[0]!.id;

    if (subscription.plan?.usage_type === 'licensed') {
      await stripe.subscriptionItems.update(subscriptionItemId, {
        quantity,
        proration_behavior: 'always_invoice',
      });
    } else {
      await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        action: 'set',
      });
    }
  } catch (error: any) {
    logger.error(`Error creating usage record: ${error.message}`);
  }
};

export const cancelSubscription = async (subscriptionId: string) => {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error: any) {
    logger.error(`Error creating usage record: ${error.message}`);
  }
};

/**
 * Get prices
 * @returns The prices
 */
export const getPrices = async (): Promise<Stripe.Price[] | null> => {
  try {
    const { data: prices } = await stripe.prices.list({ active: true, expand: ['data.tiers'] });
    return prices.length > 0 ? convertSnakeToCamelCase(prices) : null;
  } catch (error: any) {
    logger.error(`Error fetching prices: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

export const createProduct = async () => {
  try {
    // // Monthly Subscription
    // const product1 = await stripe.products.create({
    //   name: 'Teams Membership - Monthly',
    //   description: 'Subscription-based pricing for Teams - Monthly Plan',
    //   type: 'service',
    // });

    // await stripe.prices.create({
    //   product: product1.id,
    //   nickname: 'Connect Pricing - Monthly',
    //   currency: 'eur',
    //   billing_scheme: 'tiered',
    //   recurring: {
    //     interval: 'month',
    //     interval_count: 1,
    //     usage_type: 'metered',
    //     aggregate_usage: 'last_during_period',
    //   },
    //   tiers_mode: 'graduated',
    //   tiers: [
    //     { flat_amount: 2660, up_to: 5 }, // $26.60 for first 5 members
    //     { unit_amount: 532, up_to: 24 }, // $5.32 for 1-24 members
    //     { unit_amount: 482, up_to: 99 }, // $4.82 for 25-99 members
    //     { unit_amount: 432, up_to: 249 }, // $4.32 for 100-249 members
    //     { unit_amount: 382, up_to: 999 }, // $3.82 for 250-999 members
    //     { unit_amount: 332, up_to: 'inf' }, // $3.32 for 1000+ members
    //   ],
    //   active: true,
    // });

    // Yearly Subscription
    const product2 = await stripe.products.create({
      name: 'Teams Membership - Yearly',
      description: 'Subscription-based pricing for Teams - Yearly Plan',
      type: 'service',
    });

    await stripe.prices.create({
      product: product2.id,
      nickname: 'Connect Pricing - Yearly',
      currency: 'eur',
      billing_scheme: 'tiered',
      recurring: {
        interval: 'year',
        interval_count: 1,
        usage_type: 'licensed',
      },
      tiers_mode: 'graduated',
      tiers: [
        { flat_amount: 25920, up_to: 5 }, // $21.60 for first 5 members
        { unit_amount: 5184, up_to: 24 }, // $4.32 for 1-24 members
        { unit_amount: 4704, up_to: 99 }, // $3.92 for 25-99 members
        { unit_amount: 4224, up_to: 249 }, // $3.52 for 100-249 members
        { unit_amount: 3744, up_to: 999 }, // $3.12 for 250-999 members
        { unit_amount: 3264, up_to: 'inf' }, // $2.72 for 1000+ members
      ],
      active: true,
    });
  } catch (error: any) {
    logger.error(`Error creating product: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Error creating product');
  }
};
