import httpStatus from 'http-status';
import mongoose from 'mongoose';
import ApiError from '../errors/ApiError';
import Template from './template.model';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedTemplate, UpdateTemplateBody, ITemplateDoc } from './template.interfaces';
import { uploadFile } from '../utils';
import { Link } from '../link';

const populate = [
  {
    path: 'direct',
    populate: {
      path: 'platform',
    },
  },
];

/**
 * Create a template
 * @param {NewCreatedTemplate} templateBody
 * @param {any} files
 * @returns {Promise<ITemplateDoc>}
 */
export const createTemplate = async (templateBody: NewCreatedTemplate, files?: any): Promise<ITemplateDoc> => {
  const body: any = { ...templateBody };
  const templates = await Template.find({ user: body.user });
  if (templates.length > 9) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template limit exceeded');
  }
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) {
          body[field] = await uploadFile(files[field][0], 'template');
        }
      })
    );
  }
  return Template.create(templateBody).then((t) => t.populate(populate));
};

/**
 * Query for templates
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryTemplates = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const templates = await Template.paginate(filter, { ...options, populate: 'direct.platform' });
  return templates;
};

/**
 * Get template by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ITemplateDoc | null>}
 */
export const getTemplateById = async (id: mongoose.Types.ObjectId): Promise<ITemplateDoc | null> =>
  Template.findById(id).populate(populate);

/**
 * Update template by id
 * @param {mongoose.Types.ObjectId} templateId
 * @param {UpdateTemplateBody} updateBody
 * @param {any} files
 * @returns {Promise<ITemplateDoc | null>}
 */
export const updateTemplateById = async (
  templateId: mongoose.Types.ObjectId,
  updateBody: UpdateTemplateBody,
  files: any
): Promise<ITemplateDoc | null> => {
  const body: any = { ...updateBody };
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) {
          body[field] = await uploadFile(files[field][0], 'template');
        }
      })
    );
  }
  Object.assign(template, body);
  await template.save().then((t) => t.populate(populate));
  return template;
};

/**
 * Delete template by id
 * @param {mongoose.Types.ObjectId} templateId
 */
export const deleteTemplateById = async (templateId: mongoose.Types.ObjectId) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }
  await template.deleteOne();
};

/**
 * Duplicate template by id
 * @param {mongoose.Types.ObjectId} templateId
 */
export const duplicateTemplate = async (templateId: mongoose.Types.ObjectId) => {
  // Find the template by ID, excluding the fields that should not be duplicated
  const template = await Template.findById(templateId).select('-createdAt -updatedAt');

  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }

  const templates = await Template.find({ team: template.team });
  if (templates.length > 9) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template limit exceeded');
  }

  // Convert the template to an object and delete the _id
  const templateData = template.toObject();
  delete templateData._id;

  // Create the duplicated template
  const newTemplate = await Template.create(templateData);

  // Find and duplicate all links associated with the original template
  const links = await Link.find({ template: templateId });
  const newLinks = links.map((link) => {
    const linkData = link.toObject();
    delete linkData._id;
    linkData.template = newTemplate._id; // Associate with the new template
    return linkData;
  });

  // Insert the duplicated links into the database
  await Link.insertMany(newLinks);

  // Populate the new template with related fields
  return newTemplate.populate(populate);
};
