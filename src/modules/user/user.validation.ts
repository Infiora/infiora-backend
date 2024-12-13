import Joi from 'joi';
import { password, objectId, username } from '../validate/custom.validation';
import { NewCreatedUser } from './user.interfaces';

const createUserBody: Record<keyof NewCreatedUser, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  role: Joi.string().required().valid('user', 'admin'),
  subscription: Joi.string().required().valid('', 'pro', 'premium', 'team'),
};

export const createUser = {
  body: Joi.object().keys(createUserBody),
};

export const getUsers = {
  query: Joi.object().keys({
    search: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateUserById = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      username: Joi.string().custom(username),
      live: Joi.string().custom(objectId),
      template: Joi.string().custom(objectId).allow(null, ''),
      isLocked: Joi.boolean(),
      role: Joi.string().valid('user', 'admin'),
      subscription: Joi.string().valid('', 'pro', 'premium', 'team'),
      languageCode: Joi.string().valid('en', 'de'),
    })
    .min(1),
};

export const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateUser = {
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      username: Joi.string().custom(username),
      fcmToken: Joi.string(),
      isLocked: Joi.boolean(),
      live: Joi.string().custom(objectId),
      template: Joi.string().custom(objectId).allow(null, ''),
      languageCode: Joi.string().valid('en', 'de'),
    })
    .min(1),
};

export const exportLeads = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const createPaymentMethod = {
  body: Joi.object().keys({
    tokenId: Joi.string().required(),
    paymentMethodId: Joi.string().required(),
  }),
};

export const updatePaymentMethod = {
  body: Joi.object().keys({
    billing_details: Joi.object().keys({
      email: Joi.string().required(),
      address: Joi.object().keys({
        country: Joi.string().required(),
        postal_code: Joi.string().required(),
      }),
    }),
  }),
};

export const subscribe = {
  body: Joi.object().keys({
    priceId: Joi.string().required(),
    quantity: Joi.number().required(),
    interval: Joi.string().required(),
  }),
};

export const addIntegration = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    data: Joi.any(),
  }),
};

export const removeIntegration = {
  body: Joi.object().keys({
    key: Joi.string().required(),
  }),
};
