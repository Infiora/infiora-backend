import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedPlatform } from './platform.interfaces';

const createPlatformBody: Record<keyof NewCreatedPlatform, any> = {
  category: Joi.string(),
  title: Joi.string(),
  headline: Joi.string(),
  image: Joi.string(),
  webBaseURL: Joi.string(),
  iOSBaseURL: Joi.string(),
  androidBaseURL: Joi.string(),
  type: Joi.string(),
};

export const getPlatforms = {
  query: Joi.object().keys({
    search: Joi.string(),
    category: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const createPlatform = {
  body: Joi.object().keys(createPlatformBody),
};

export const getPlatform = {
  params: Joi.object().keys({
    platformId: Joi.string().custom(objectId),
  }),
};

export const updatePlatform = {
  params: Joi.object().keys({
    platformId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string(),
    headline: Joi.string().allow(null, ''),
    image: Joi.string(),
    webBaseURL: Joi.string().allow(null, ''),
    iOSBaseURL: Joi.string().allow(null, ''),
    androidBaseURL: Joi.string().allow(null, ''),
    type: Joi.string(),
  }),
};

export const deletePlatform = {
  params: Joi.object().keys({
    platformId: Joi.string().custom(objectId),
  }),
};
