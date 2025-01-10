import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedRoom } from './room.interfaces';

const createRoomBody: Record<keyof NewCreatedRoom, any> = {
  hotel: Joi.custom(objectId),
  quantity: Joi.number(),
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
    description: Joi.string().allow(null, ''),
    group: Joi.custom(objectId).allow(null, ''),
    background: Joi.object().keys({
      color: Joi.string().allow(null, ''),
      direction: Joi.string().allow(null, ''),
      type: Joi.string().allow(null, ''),
    }),
    font: Joi.object().keys({
      color: Joi.string().allow(null, ''),
    }),
    button: Joi.object().keys({
      color: Joi.string().allow(null, ''),
      backgroundColor: Joi.string().allow(null, ''),
      variant: Joi.string().allow(null, ''),
      borderRadius: Joi.string().allow(null, ''),
    }),
  }),
};

export const deleteRoom = {
  params: Joi.object().keys({
    roomId: Joi.required().custom(objectId),
  }),
};
