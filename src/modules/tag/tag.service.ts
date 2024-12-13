import httpStatus from 'http-status';
import mongoose, { isValidObjectId } from 'mongoose';
import { json2csv } from 'json-2-csv';
import Tag from './tag.model';
import ApiError from '../errors/ApiError';
import { NewCreatedTag, UpdateTagBody, ITagDoc } from './tag.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { User } from '../user';

/**
 * Query for tags
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryTags = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const tags = await Tag.paginate(filter, options);
  return tags;
};

/**
 * Get tag by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ITagDoc | null>}
 */
export const getTagById = async (id: mongoose.Types.ObjectId): Promise<ITagDoc | null> => Tag.findById(id);

/**
 * Get tag by customId
 * @param {mongoose.Types.ObjectId} customId
 * @returns {Promise<ITagDoc | null>}
 */
export const getTagByCustomId = async (customId: string): Promise<ITagDoc | null> => Tag.findOne({ customId });

/**
 * Get tag by id
 * @param {string} id
 * @returns {Promise<ITagDoc | null>}
 */
export const getTag = async (id: string): Promise<ITagDoc | null> =>
  isValidObjectId(id) ? getTagById(new mongoose.Types.ObjectId(id)) : getTagByCustomId(id);

/**
 * Create a tag
 * @param {NewCreatedTag} tagBody
 * @returns {Promise<ITagDoc>}
 */
export const createTag = async (tagBody: NewCreatedTag): Promise<ITagDoc> => {
  if (tagBody.customId) {
    const isTakenByTag = await Tag.isCustomIdTaken(tagBody.customId);
    const isUser = await User.isUsernameTaken(tagBody.customId);
    const isTag = isValidObjectId(tagBody.customId) && (await getTagById(new mongoose.Types.ObjectId(tagBody.customId)));

    if (isTakenByTag || isUser || isTag) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Custom id is already taken');
    }
  }
  return Tag.create(tagBody);
};

/**
 * Update tag by id
 * @param {mongoose.Types.ObjectId} tagId
 * @param {UpdateTagBody} updateBody
 * @returns {Promise<ITagDoc | null>}
 */
export const updateTagById = async (tagId: mongoose.Types.ObjectId, updateBody: UpdateTagBody): Promise<ITagDoc | null> => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  if (updateBody.customId) {
    const isTakenByTag = await Tag.isCustomIdTaken(updateBody.customId, tagId);
    const isUser = await User.isUsernameTaken(updateBody.customId);
    const isTag =
      isValidObjectId(updateBody.customId) && (await getTagById(new mongoose.Types.ObjectId(updateBody.customId)));

    if (isTakenByTag || isUser || isTag) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Custom id is already taken');
    }
  }
  Object.assign(tag, updateBody);
  await tag.save();
  return tag;
};

/**
 * Delete tag by id
 * @param {mongoose.Types.ObjectId} tagId
 * @returns {Promise<ITagDoc | null>}
 */
export const deleteTagById = async (tagId: mongoose.Types.ObjectId): Promise<ITagDoc | null> => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  await tag.deleteOne();
  return tag;
};

/**
 * Link tag by id
 * @param {mongoose.Types.ObjectId} tagId
 * @param {mongoose.Types.ObjectId} userId
 * @param {string} type
 * @returns {Promise<ITagDoc | null>}
 */
export const linkTagById = async (tagId: string, userId: mongoose.Types.ObjectId, type: string): Promise<ITagDoc | null> => {
  const tag = await (isValidObjectId(tagId) ? getTagById(new mongoose.Types.ObjectId(tagId)) : getTagByCustomId(tagId));

  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  if (tag.user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This device is already activated.');
  }
  if (!tag.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This device is not enabled.');
  }
  Object.assign(tag, { user: userId, type });
  await tag.save();
  return tag;
};

/**
 * Unlink tag by id
 * @param {mongoose.Types.ObjectId} tagId
 * @returns {Promise<ITagDoc | null>}
 */
export const unlinkTagById = async (tagId: mongoose.Types.ObjectId): Promise<ITagDoc | null> => {
  return Tag.findByIdAndUpdate(tagId, { $unset: { user: 1 } });
};

/**
 * Export tags in csv
 * @param {Object} filter - Mongo filter
 * @returns {Promise<string | null>}
 */
export const exportTags = async (filter: Record<string, any>): Promise<any> => {
  const tags = await Tag.find(filter, { url: 1 });
  const tagsWithUrls = tags.map((tag) => ({ url: tag.toObject({ virtuals: true }).url }));
  const csvData = json2csv(tagsWithUrls);

  return csvData;
};
