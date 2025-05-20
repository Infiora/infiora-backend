import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedRoom, UpdateRoomBody } from './room.interfaces';
import { NewCreatedFeedback } from '../feedback/feedback.interfaces';

export const createRoom = {
  body: Joi.object<NewCreatedRoom>({
    hotel: Joi.custom(objectId),
    quantity: Joi.number(),
    suffix: Joi.string().allow(null, ''),
    prefix: Joi.string().allow(null, ''),
    start: Joi.number().allow(null, ''),
  }),
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
  body: Joi.object<UpdateRoomBody>({
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
        mainButtonText: Joi.string().allow(null, ''),
        type: Joi.string().allow(null, ''),
        color: Joi.string().allow(null, ''),
        imageType: Joi.string().valid('none', 'icon', 'image', 'url'),
        image: Joi.any(),
        isActive: Joi.boolean(),
      })
      .allow(null, ''),
    feedback: Joi.object()
      .keys({
        message: Joi.string().allow(null, ''),
        successMessage: Joi.string().allow(null, ''),
        buttonText: Joi.string().allow(null, ''),
        mainButtonText: Joi.string().allow(null, ''),
        link: Joi.string().allow(null, ''),
        type: Joi.string().allow(null, ''),
        color: Joi.string().allow(null, ''),
        imageType: Joi.string().valid('none', 'icon', 'image', 'url'),
        image: Joi.any(),
        questions: Joi.array().items(
          Joi.object().keys({
            text: Joi.string(),
            type: Joi.any(),
          })
        ),
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

export const createFeedback = {
  body: Joi.object<NewCreatedFeedback>({
    room: Joi.required().custom(objectId),
    hotel: Joi.required().custom(objectId),
    answers: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.valid(null)).required(),
        })
      )
      .required(),
  }),
};

export const getFeedbacks = {
  query: Joi.object().keys({
    room: Joi.custom(objectId),
    hotel: Joi.required().custom(objectId),
    startDate: Joi.string(),
    endDate: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
