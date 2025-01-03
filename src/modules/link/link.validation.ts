import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedLink } from './link.interfaces';

const createLinkBody: Record<keyof NewCreatedLink, any> = {
  room: Joi.custom(objectId),
  group: Joi.custom(objectId),
  title: Joi.string(),
  url: Joi.string(),
};

export const createLink = {
  body: Joi.object().keys(createLinkBody),
};

export const getLinks = {
  query: Joi.object().keys({
    room: Joi.custom(objectId),
    group: Joi.custom(objectId),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getLink = {
  params: Joi.object().keys({
    linkId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    room: Joi.custom(objectId),
  }),
};

export const updateLink = {
  params: Joi.object().keys({
    linkId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string(),
    url: Joi.string(),
    isActive: Joi.boolean(),
  }),
};

export const deleteLink = {
  params: Joi.object().keys({
    linkId: Joi.required().custom(objectId),
  }),
};

export const reorderLinks = {
  params: Joi.object({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object({
    orderedLinks: Joi.array().items(Joi.custom(objectId)).required(),
  }),
};
