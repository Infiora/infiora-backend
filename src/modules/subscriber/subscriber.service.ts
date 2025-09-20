import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Subscriber from './subscriber.model';
import ApiError from '../errors/ApiError';
import { NewCreatedSubscriber, UpdateSubscriberBody, ISubscriberDoc } from './subscriber.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';

/**
 * Query for subscribers
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const querySubscribers = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const subscribers = await Subscriber.paginate(filter, options);
  return subscribers;
};

/**
 * Get subscriber by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ISubscriberDoc | null>}
 */
export const getSubscriberById = async (id: mongoose.Types.ObjectId): Promise<ISubscriberDoc | null> =>
  Subscriber.findById(id);

/**
 * Create a subscriber
 * @param {NewCreatedSubscriber} subscriberBody
 * @returns {Promise<ISubscriberDoc>}
 */
export const createSubscriber = async (subscriberBody: NewCreatedSubscriber): Promise<ISubscriberDoc> => {
  const body = { ...subscriberBody };
  return Subscriber.create(body);
};

/**
 * Update subscriber by id
 * @param {mongoose.Types.ObjectId} subscriberId
 * @param {UpdateSubscriberBody} subscriberBody
 * @param {Express.Multer.File | undefined} file
 * @returns {Promise<ISubscriberDoc | null>}
 */
export const updateSubscriberById = async (
  subscriberId: mongoose.Types.ObjectId,
  subscriberBody: UpdateSubscriberBody
): Promise<ISubscriberDoc | null> => {
  const body = { ...subscriberBody };
  const subscriber = await getSubscriberById(subscriberId);
  if (!subscriber) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscriber not found');
  }
  Object.assign(subscriber, body);
  await subscriber.save();
  return subscriber;
};

/**
 * Delete subscriber by id
 * @param {mongoose.Types.ObjectId} subscriberId
 * @returns {Promise<ISubscriberDoc | null>}
 */
export const deleteSubscriberById = async (subscriberId: mongoose.Types.ObjectId): Promise<ISubscriberDoc | null> => {
  const subscriber = await getSubscriberById(subscriberId);
  if (!subscriber) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscriber not found');
  }
  await subscriber.deleteOne();
  return subscriber;
};
