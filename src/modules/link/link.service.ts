import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Link from './link.model';
import ApiError from '../errors/ApiError';
import { NewCreatedLink, UpdateLinkBody, ILinkDoc } from './link.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';
import { uploadToS3 } from '../utils/awsS3Utils';

/**
 * Handle file uploads for link body
 * @param {any} body - Link body object
 * @param {Express.Multer.File[] | undefined} files - Uploaded files
 * @returns {Promise<void>}
 */
const handleFileUploads = async (body: any, files?: Express.Multer.File[]): Promise<void> => {
  if (!files || files.length === 0) return;

  const linkBody = body;

  // Handle main image
  const mainImageFile = files.find((file) => file.fieldname === 'image');
  if (mainImageFile) {
    linkBody.image = await uploadToS3(mainImageFile, 'link');
  }

  // Handle section images
  const sectionImageFiles = files.filter(
    (file) => file.fieldname.startsWith('sections[') && file.fieldname.includes('[images][')
  );

  if (sectionImageFiles.length > 0 && linkBody.sections) {
    // Parse sections if they come as strings
    if (typeof linkBody.sections === 'string') {
      linkBody.sections = JSON.parse(linkBody.sections);
    }

    // Process each section image file
    await Promise.all(
      sectionImageFiles.map(async (file) => {
        const match = file.fieldname.match(/sections\[(\d+)\]\[images\]\[(\d+)\]/);
        if (match && match[1] && match[2]) {
          const sectionIndex = parseInt(match[1], 10);
          const imageIndex = parseInt(match[2], 10);

          if (linkBody.sections && linkBody.sections[sectionIndex]) {
            const section = linkBody.sections[sectionIndex];
            if (section && !section.images) {
              section.images = [];
            }

            const uploadedImageUrl = await uploadToS3(file, 'link/sections');
            if (section && section.images) {
              section.images[imageIndex] = uploadedImageUrl;
            }
          }
        }
      })
    );
  }
};

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
 * @param {Express.Multer.File[] | undefined} files
 * @returns {Promise<ILinkDoc>}
 */
export const createLink = async (linkBody: NewCreatedLink, files?: Express.Multer.File[]): Promise<ILinkDoc> => {
  const body = { ...linkBody };

  await handleFileUploads(body, files);

  return Link.create(body);
};

/**
 * Update link by id
 * @param {mongoose.Types.ObjectId} linkId
 * @param {UpdateLinkBody} linkBody
 * @param {Express.Multer.File[] | undefined} files
 * @returns {Promise<ILinkDoc | null>}
 */
export const updateLinkById = async (
  linkId: mongoose.Types.ObjectId,
  linkBody: UpdateLinkBody,
  files?: Express.Multer.File[]
): Promise<ILinkDoc | null> => {
  const body = { ...linkBody };
  const link = await getLinkById(linkId);
  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found');
  }

  await handleFileUploads(body, files);

  Object.assign(link, body);
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
