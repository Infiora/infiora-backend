import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedRoom } from './room.interfaces';

const createRoomBody: Record<keyof NewCreatedRoom, any> = {
  hotel: Joi.custom(objectId),
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
};

export const createRoom = {
  body: Joi.object().keys(createRoomBody),
};

export const getRooms = {
  query: Joi.object().keys({
    hotel: Joi.custom(objectId),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getRoom = {
  params: Joi.object().keys({
    roomId: Joi.required().custom(objectId),
  }),
};

export const updateRoom = {
  params: Joi.object().keys({
    roomId: Joi.required().custom(objectId),
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

export const deleteRoom = {
  params: Joi.object().keys({
    roomId: Joi.required().custom(objectId),
  }),
};
