import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedSupport } from './support.interfaces';

const createSupportBody: Record<keyof NewCreatedSupport, any> = {
  category: Joi.string(),
  subject: Joi.string(),
  message: Joi.string(),
};

export const createSupport = {
  body: Joi.object().keys(createSupportBody),
};

export const getSupports = {
  query: Joi.object().keys({
    user: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getSupport = {
  params: Joi.object().keys({
    supportId: Joi.string().custom(objectId),
  }),
};

export const updateSupportById = {
  params: Joi.object().keys({
    supportId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string(),
  }),
};

export const deleteSupport = {
  params: Joi.object().keys({
    supportId: Joi.string().custom(objectId),
  }),
};
