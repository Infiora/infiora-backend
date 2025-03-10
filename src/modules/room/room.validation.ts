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
  query: Joi.object().keys({
    action: Joi.string(),
    time: Joi.number(),
    device: Joi.string(),
    language: Joi.string(),
    engaged: Joi.boolean(),
    activityId: Joi.custom(objectId),
    visitorId: Joi.string(),
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
    orderedLinks: Joi.array().items(Joi.custom(objectId)),
    background: Joi.object()
      .keys({
        color: Joi.string().allow(null, ''),
        direction: Joi.string().allow(null, ''),
        type: Joi.string().allow(null, ''),
      })
      .allow(null, ''),
    font: Joi.object()
      .keys({
        color: Joi.string().allow(null, ''),
        family: Joi.string().allow(null, ''),
      })
      .allow(null, ''),
    button: Joi.object()
      .keys({
        color: Joi.string().allow(null, ''),
        backgroundColor: Joi.string().allow(null, ''),
        variant: Joi.string().allow(null, ''),
        borderRadius: Joi.string().allow(null, ''),
      })
      .allow(null, ''),
    popup: Joi.object()
      .keys({
        message: Joi.string().allow(null, ''),
        buttonText: Joi.string().allow(null, ''),
        link: Joi.string().allow(null, ''),
        color: Joi.string().allow(null, ''),
        isActive: Joi.boolean(),
      })
      .allow(null, ''),
    newsletter: Joi.object()
      .keys({
        message: Joi.string().allow(null, ''),
        successMessage: Joi.string().allow(null, ''),
        buttonText: Joi.string().allow(null, ''),
        type: Joi.string().allow(null, ''),
        color: Joi.string().allow(null, ''),
        isActive: Joi.boolean(),
      })
      .allow(null, ''),
    isActive: Joi.boolean(),
  }),
};

export const deleteRoom = {
  params: Joi.object().keys({
    roomId: Joi.required().custom(objectId),
  }),
};
