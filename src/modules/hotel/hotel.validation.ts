import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedHotel } from './hotel.interfaces';

const createHotelBody: Record<keyof NewCreatedHotel, any> = {
  user: Joi.required().custom(objectId),
  name: Joi.string(),
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

export const updateHotelById = {
  params: Joi.object().keys({
    hotelId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    isActive: Joi.string(),
  }),
};

export const deleteHotel = {
  params: Joi.object().keys({
    hotelId: Joi.required().custom(objectId),
  }),
};
