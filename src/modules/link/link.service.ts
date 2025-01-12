import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Link from './link.model';
import ApiError from '../errors/ApiError';
import { NewCreatedLink, UpdateLinkBody, ILinkDoc } from './link.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';

/**
 * Query for links
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryLinks = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const links = await Link.paginate(filter, options);
  return links;
};

/**
 * Get link by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ILinkDoc | null>}
 */
export const getLinkById = async (id: mongoose.Types.ObjectId): Promise<ILinkDoc | null> => Link.findById(id);

/**
 * Create a link
 * @param {NewCreatedLink} linkBody
 * @returns {Promise<ILinkDoc>}
 */
export const createLink = async (linkBody: NewCreatedLink): Promise<ILinkDoc> => {
  return Link.create(linkBody);
};

/**
 * Update link by id
 * @param {mongoose.Types.ObjectId} linkId
 * @param {UpdateLinkBody} linkBody
 * @returns {Promise<ILinkDoc | null>}
 */
export const updateLinkById = async (
  linkId: mongoose.Types.ObjectId,
  linkBody: UpdateLinkBody
): Promise<ILinkDoc | null> => {
  const link = await getLinkById(linkId);
  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found');
  }
  Object.assign(link, linkBody);
  await link.save();
  return link;
};

/**
 * Delete link by id
 * @param {mongoose.Types.ObjectId} linkId
 * @returns {Promise<ILinkDoc | null>}
 */
export const deleteLinkById = async (linkId: mongoose.Types.ObjectId): Promise<ILinkDoc | null> => {
  const link = await getLinkById(linkId);
  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found');
  }
  await link.deleteOne();
  return link;
};

/**
 * Reorder room's links
 * @param {mongoose.Types.ObjectId} id
 * @param {UpdateProfileBody} body
 * @returns {Promise<void>}
 */
export const reorderLinks = async (id: mongoose.Types.ObjectId, body: any): Promise<void> => {
  await Promise.all(
    Array.from(body.orderedLinks, async (linkId: string, i) => {
      const link = await getLinkById(toObjectId(linkId));
      if (link && (link.room?.toString() === id.toString() || link.group?.toString() === id.toString())) {
        link.position = i;
        await link.save();
      }
    })
  );
};
