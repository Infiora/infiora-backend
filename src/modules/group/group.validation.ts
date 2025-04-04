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
  popup: Joi.object().keys({
    message: Joi.string().allow(null, ''),
    buttonText: Joi.string().allow(null, ''),
    link: Joi.string().allow(null, ''),
    color: Joi.string().allow(null, ''),
    isActive: Joi.boolean(),
  }),
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
  }),
};

export const deleteGroup = {
  params: Joi.object().keys({
    groupId: Joi.required().custom(objectId),
  }),
};

export const duplicateGroup = {
  params: Joi.object().keys({
    groupId: Joi.required().custom(objectId),
  }),
};
