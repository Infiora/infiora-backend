import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedGroup } from './group.interfaces';

const createGroupBody: Record<keyof NewCreatedGroup, any> = {
  hotel: Joi.custom(objectId),
  name: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  type: Joi.string().allow(null, ''),
  capacity: Joi.number().allow(null, ''),
  amenities: Joi.array().items(Joi.string()),
  price: Joi.string().allow(null, ''),
  theme: Joi.string().allow(null, ''),
  layout: Joi.string().allow(null, ''),
  images: Joi.any(),
};

export const createGroup = {
  body: Joi.object().keys(createGroupBody),
};

export const getGroups = {
  query: Joi.object().keys({
    hotel: Joi.custom(objectId),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getGroup = {
  params: Joi.object().keys({
    groupId: Joi.required().custom(objectId),
  }),
};

export const updateGroup = {
  params: Joi.object().keys({
    groupId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    number: Joi.string(),
    name: Joi.string().allow(null, ''),
    description: Joi.string().allow(null, ''),
    type: Joi.string().allow(null, ''),
    capacity: Joi.number().allow(null, ''),
    amenities: Joi.array().items(Joi.string()),
    price: Joi.string().allow(null, ''),
    theme: Joi.string().allow(null, ''),
    layout: Joi.string().allow(null, ''),
    images: Joi.any(),
  }),
};

export const deleteGroup = {
  params: Joi.object().keys({
    groupId: Joi.required().custom(objectId),
  }),
};
