import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Group from './group.model';
import ApiError from '../errors/ApiError';
import { NewCreatedGroup, UpdateGroupBody, IGroupDoc, groupPopulate } from './group.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { uploadToS3 } from '../utils/awsS3Utils';
import { toPopulateString } from '../utils/miscUtils';

/**
 * Query for groups
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryGroups = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const groups = await Group.paginate(filter, { ...options, populate: toPopulateString(groupPopulate) });
  return groups;
};

/**
 * Get group by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IGroupDoc | null>}
 */
export const getGroupById = async (id: mongoose.Types.ObjectId): Promise<IGroupDoc | null> =>
  Group.findById(id).populate(groupPopulate);

/**
 * Create a group
 * @param {NewCreatedGroup} groupBody
 * @param {Express.Multer.File[]} files
 * @returns {Promise<IGroupDoc>}
 */
export const createGroup = async (groupBody: NewCreatedGroup, files?: Express.Multer.File[]): Promise<IGroupDoc> => {
  const body = { ...groupBody };
  if (files && files.length > 0) {
    body.images = await Promise.all(files.map((file) => uploadToS3(file, 'group')));
  }
  return Group.create(body).then((t) => t.populate(groupPopulate));
};

/**
 * Update group by id
 * @param {mongoose.Types.ObjectId} groupId
 * @param {UpdateGroupBody} updateBody
 * @param {Express.Multer.File[]} files
 * @returns {Promise<IGroupDoc | null>}
 */
export const updateGroupById = async (
  groupId: mongoose.Types.ObjectId,
  groupBody: UpdateGroupBody,
  files?: Express.Multer.File[]
): Promise<IGroupDoc | null> => {
  const body = { ...groupBody };
  const group = await getGroupById(groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  if (files && files.length > 0) {
    body.images = await Promise.all(files.map((file) => uploadToS3(file, 'group')));
  }
  Object.assign(group, body);
  await group.save().then((t) => t.populate(groupPopulate));
  return group;
};

/**
 * Delete group by id
 * @param {mongoose.Types.ObjectId} groupId
 * @returns {Promise<IGroupDoc | null>}
 */
export const deleteGroupById = async (groupId: mongoose.Types.ObjectId): Promise<IGroupDoc | null> => {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  await group.deleteOne();
  return group;
};
