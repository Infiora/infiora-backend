import httpStatus from 'http-status';
import mongoose from 'mongoose';
import ApiError from '../errors/ApiError';
import { NewCreatedPlatform, UpdatePlatformBody, IPlatformDoc } from './platform.interfaces';
import { uploadFile } from '../utils';
import Platform from './platform.model';
import Category from '../category/category.model';
import { IOptions, QueryResult } from '../paginate/paginate';

/**
 * Create a platform
 * @param {NewCreatedPlatform} platformBody
 * @param {any} file
 * @returns {Promise<IPlatformDoc>}
 */
export const createPlatform = async (platformBody: NewCreatedPlatform, file: any): Promise<IPlatformDoc> => {
  const body = platformBody;
  if (!body.category) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category is required');
  }
  if (await Platform.isTitleTaken(body.title)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Platform title already taken');
  }

  if (file) {
    body.image = await uploadFile(file, 'platform');
  }

  const platform = await Platform.create(body);

  await Category.findByIdAndUpdate(body.category, { $push: { platforms: platform.id } });

  return platform;
};

/**
 * Query for platforms
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryPlatforms = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const platforms = await Platform.paginate(filter, options);
  return platforms;
};

/**
 * Get platform by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IPlatformDoc | null>}
 */
export const getPlatformById = async (id: mongoose.Types.ObjectId): Promise<IPlatformDoc | null> => Platform.findById(id);

/**
 * Update platform by id
 * @param {mongoose.Types.ObjectId} platformId
 * @param {UpdatePlatformBody} updateBody
 * @param {any} file
 * @returns {Promise<IPlatformDoc | null>}
 */
export const updatePlatformById = async (
  platformId: mongoose.Types.ObjectId,
  updateBody: UpdatePlatformBody,
  file: any
): Promise<IPlatformDoc | null> => {
  const body = updateBody;
  const platform = await getPlatformById(platformId);
  if (!platform) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
  }
  if (body.title && (await Platform.isTitleTaken(body.title, platformId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Platform title already taken');
  }

  if (file) {
    body.image = await uploadFile(file, 'platform');
  }

  Object.assign(platform, body);
  await platform.save();
  return platform;
};

/**
 * Delete platform by id
 * @param {mongoose.Types.ObjectId} platformId
 * @returns {Promise<IPlatformDoc | null>}
 */
export const deletePlatformById = async (platformId: mongoose.Types.ObjectId): Promise<IPlatformDoc | null> => {
  const platform = await getPlatformById(platformId);
  if (!platform) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
  }
  await platform.deleteOne();
  return platform;
};
