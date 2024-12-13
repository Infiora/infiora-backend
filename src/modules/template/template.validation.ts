import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedTemplate, UpdateTemplateBody } from './template.interfaces';

const baseTemplateSchema = {
  title: Joi.string().allow(null, ''),
  layout: Joi.string().allow(null),
  image: Joi.string().allow(null, ''),
  cover: Joi.string().allow(null, ''),
  logo: Joi.string().allow(null, ''),
  company: Joi.string().allow(null, ''),
  bio: Joi.string().allow(null, ''),
  theme: Joi.string().allow(null, ''),
  themeLinks: Joi.string().allow(null, ''),
  location: Joi.string().allow(null, ''),
  sectionTitle: Joi.string().allow(null, ''),
  isLeadCapture: Joi.boolean(),
  leadCapture: Joi.object().allow(null),
  isDirect: Joi.boolean(),
  direct: Joi.string().allow(null, ''),
  qrTheme: Joi.string().allow(null, ''),
  qrLogo: Joi.string().allow(null, ''),
};

export const createTemplate = {
  body: Joi.object<NewCreatedTemplate>({
    ...baseTemplateSchema,
  }),
};

export const getTemplates = {
  query: Joi.object().keys({
    team: Joi.string().optional(),
    search: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional().default(10),
    page: Joi.number().integer().optional().default(1),
  }),
};

export const getTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string().custom(objectId).required(),
  }),
};

export const updateTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object<UpdateTemplateBody>({
    ...baseTemplateSchema,
  }),
};

export const deleteTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string().custom(objectId).required(),
  }),
};
