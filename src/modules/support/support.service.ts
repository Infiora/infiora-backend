import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Support from './support.model';
import ApiError from '../errors/ApiError';
import { NewCreatedSupport, UpdateSupportBody, ISupportDoc } from './support.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';

const populate = [
  {
    path: 'user',
  },
];

/**
 * Create a support
 * @param {NewCreatedSupport} supportBody
 * @returns {Promise<ISupportDoc>}
 */
export const createSupport = async (supportBody: NewCreatedSupport): Promise<ISupportDoc> => {
  return Support.create(supportBody).then((t) => t.populate(populate));
};

/**
 * Query for supports
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const querySupports = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const supports = await Support.paginate(filter, { ...options, populate: 'user' });
  return supports;
};

/**
 * Get support by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ISupportDoc | null>}
 */
export const getSupportById = async (id: mongoose.Types.ObjectId): Promise<ISupportDoc | null> =>
  Support.findById(id).populate(populate);

/**
 * Update support by id
 * @param {mongoose.Types.ObjectId} supportId
 * @param {UpdateSupportBody} updateBody
 * @returns {Promise<ISupportDoc | null>}
 */
export const updateSupportById = async (
  supportId: mongoose.Types.ObjectId,
  updateBody: UpdateSupportBody
): Promise<ISupportDoc | null> => {
  const support = await getSupportById(supportId);
  if (!support) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support not found');
  }

  Object.assign(support, updateBody);
  await support.save().then((t) => t.populate(populate));
  return support;
};

/**
 * Delete support by id
 * @param {mongoose.Types.ObjectId} supportId
 * @returns {Promise<ISupportDoc | null>}
 */
export const deleteSupportById = async (supportId: mongoose.Types.ObjectId): Promise<ISupportDoc | null> => {
  const support = await getSupportById(supportId);
  if (!support) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support not found');
  }
  await support.deleteOne();
  return support;
};
