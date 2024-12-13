import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedLink, UpdateLinkBody } from './link.interfaces';

const objectIdSchema = Joi.string().custom(objectId);

const createLinkBody: Record<keyof NewCreatedLink, Joi.Schema> = {
  profile: objectIdSchema,
  template: objectIdSchema,
  platform: objectIdSchema,
  value: Joi.string(),
  title: Joi.string().optional(),
  headline: Joi.string().optional(),
  image: Joi.string().optional(),
  file: Joi.string().optional(),
  data: Joi.string().optional(),
};

const updateLinkBody: Record<keyof UpdateLinkBody, Joi.Schema> = {
  title: Joi.string().optional(),
  headline: Joi.string().optional(),
  image: Joi.string().optional(),
  file: Joi.string().optional(),
  value: Joi.string().optional(),
  data: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  isContact: Joi.boolean().optional(),
};

export const getLinks = {
  query: Joi.object({
    profile: objectIdSchema.optional(),
    template: objectIdSchema.optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

export const getLink = {
  params: Joi.object({
    linkId: objectIdSchema.required(),
  }),
  query: Joi.object({
    isTapped: Joi.boolean().optional(),
    profile: objectIdSchema.optional(),
  }),
};

export const createLink = {
  body: Joi.object(createLinkBody),
};

export const updateLink = {
  params: Joi.object({
    linkId: objectIdSchema.required(),
  }),
  body: Joi.object(updateLinkBody),
};

export const deleteLink = {
  params: Joi.object({
    linkId: objectIdSchema.required(),
  }),
};

export const reorderLinks = {
  params: Joi.object({
    profileId: objectIdSchema.required(),
  }),
  body: Joi.object({
    orderedLinks: Joi.array().items(objectIdSchema).required(),
  }),
};
