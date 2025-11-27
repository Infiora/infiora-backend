import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedHotel } from './hotel.interfaces';

const createHotelBody: Record<keyof NewCreatedHotel, any> = {
  user: Joi.custom(objectId),
  manager: Joi.custom(objectId),
  name: Joi.string(),
  description: Joi.string().allow(null, ''),
  note: Joi.string().allow(null, ''),
  activeUntil: Joi.string().allow(null, ''),
  image: Joi.any(),
  cover: Joi.any(),
  socialLinks: Joi.any(),
};

export const createHotel = {
  body: Joi.object().keys(createHotelBody),
};

export const getHotels = {
  query: Joi.object().keys({
    user: Joi.custom(objectId),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getHotel = {
  params: Joi.object().keys({
    hotelId: Joi.required().custom(objectId),
  }),
};

export const updateHotel = {
  params: Joi.object().keys({
    hotelId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    manager: Joi.custom(objectId),
    description: Joi.string().allow(null, ''),
    note: Joi.string().allow(null, ''),
    activeUntil: Joi.string().allow(null, ''),
    image: Joi.any(),
    cover: Joi.any(),
    socialLinks: Joi.any(),
    isActive: Joi.boolean(),
  }),
};

export const deleteHotel = {
  params: Joi.object().keys({
    hotelId: Joi.required().custom(objectId),
  }),
};

export const duplicateGroup = {
  params: Joi.object().keys({
    hotelId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    group: Joi.custom(objectId),
  }),
};
