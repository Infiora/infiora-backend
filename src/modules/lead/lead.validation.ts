import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedLead } from './lead.interfaces';

const createLeadBody: Record<keyof NewCreatedLead, any> = {
  user: Joi.string().custom(objectId),
  profile: Joi.string().custom(objectId),
  type: Joi.string(),
  image: Joi.string().allow(null, ''),
  cover: Joi.string().allow(null, ''),
  logo: Joi.string().allow(null, ''),
  latitude: Joi.number().allow(null, ''),
  longitude: Joi.number().allow(null, ''),
  data: Joi.any(),
};

export const createLead = {
  body: Joi.object().keys(createLeadBody),
};

export const getLeads = {
  query: Joi.object().keys({
    user: Joi.string().custom(objectId),
    startDate: Joi.string(),
    endDate: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getLead = {
  params: Joi.object().keys({
    leadId: Joi.string().custom(objectId),
  }),
};

export const updateLead = {
  params: Joi.object().keys({
    leadId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    type: Joi.string(),
    image: Joi.string().allow(null, ''),
    cover: Joi.string().allow(null, ''),
    logo: Joi.string().allow(null, ''),
    latitude: Joi.number().allow(null, ''),
    longitude: Joi.number().allow(null, ''),
    data: Joi.any(),
  }),
};

export const deleteLead = {
  params: Joi.object().keys({
    leadId: Joi.string().custom(objectId),
  }),
};

export const getContactCard = {
  params: Joi.object().keys({
    leadId: Joi.string().custom(objectId),
  }),
};

export const exportLead = {
  params: Joi.object().keys({
    leadId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    key: Joi.string().required(),
  }),
};

export const exportLeads = {
  query: Joi.object().keys({
    user: Joi.string().custom(objectId),
    key: Joi.string().required(),
    startDate: Joi.string(),
    endDate: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
