import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Group from './group.model';
import ApiError from '../errors/ApiError';
import { NewCreatedGroup, UpdateGroupBody, IGroupDoc, groupPopulate } from './group.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { toPopulateString } from '../utils/miscUtils';
import { Link } from '../link';

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
 * @returns {Promise<IGroupDoc>}
 */
export const createGroup = async (groupBody: NewCreatedGroup): Promise<IGroupDoc> => {
  return Group.create(groupBody).then((t) => t.populate(groupPopulate));
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
  groupBody: UpdateGroupBody
): Promise<IGroupDoc | null> => {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  Object.assign(group, groupBody);
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

/**
 * Duplicate group
 * @param {mongoose.Types.ObjectId} groupId
 * @returns {Promise<any | null>}
 */
export const duplicateGroup = async (groupId: mongoose.Types.ObjectId) => {
  const group = await Group.findById(groupId).select('-createdAt -updatedAt');
  if (!group) throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');

  const groupData = group.toObject();
  delete groupData._id;

  const newGroup = await Group.create(groupData);
  const links = await Link.find({ group: groupId });

  const newLinks = links.map((link) => {
    const linkData = link.toObject();
    delete linkData._id;
    linkData.group = newGroup._id;
    return linkData;
  });

  await Link.insertMany(newLinks);
  return newGroup.populate(groupPopulate);
};
