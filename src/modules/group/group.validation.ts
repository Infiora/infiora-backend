import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedGroup } from './group.interfaces';

const createGroupBody: Record<keyof NewCreatedGroup, any> = {
  hotel: Joi.custom(objectId),
  title: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  background: Joi.object().keys({
    color: Joi.string().allow(null, ''),
    direction: Joi.string().allow(null, ''),
    type: Joi.string().allow(null, ''),
  }),
  font: Joi.object().keys({
    color: Joi.string().allow(null, ''),
    family: Joi.string().allow(null, ''),
  }),
  button: Joi.object().keys({
    color: Joi.string().allow(null, ''),
    backgroundColor: Joi.string().allow(null, ''),
    variant: Joi.string().allow(null, ''),
    borderRadius: Joi.string().allow(null, ''),
  }),
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
    title: Joi.string().allow(null, ''),
    description: Joi.string().allow(null, ''),
    background: Joi.object().keys({
      color: Joi.string().allow(null, ''),
      direction: Joi.string().allow(null, ''),
      type: Joi.string().allow(null, ''),
    }),
    font: Joi.object().keys({
      color: Joi.string().allow(null, ''),
      family: Joi.string().allow(null, ''),
    }),
    button: Joi.object().keys({
      color: Joi.string().allow(null, ''),
      backgroundColor: Joi.string().allow(null, ''),
      variant: Joi.string().allow(null, ''),
      borderRadius: Joi.string().allow(null, ''),
    }),
  }),
};

export const deleteGroup = {
  params: Joi.object().keys({
    groupId: Joi.required().custom(objectId),
  }),
};
