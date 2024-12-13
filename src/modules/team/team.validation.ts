import Joi from 'joi';
import { objectId } from '../validate/custom.validation';

export const getTeams = {
  query: Joi.object().keys({
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getTeam = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
};

export const updateTeam = {
  body: Joi.object().keys({
    admins: Joi.array().items(Joi.string()),
    company: Joi.string().allow(null, ''),
    logo: Joi.string().allow(null, ''),
  }),
};

export const addMembers = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    emails: Joi.array().items(Joi.string().email().required()).required(),
    sendInvites: Joi.boolean(),
  }),
};

export const joinTeam = {
  query: Joi.object().keys({
    token: Joi.string(),
  }),
};

export const getTeamMembers = {
  query: Joi.object().keys({
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getTeamLeads = {
  query: Joi.object().keys({
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const removeMember = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    user: Joi.string().required().custom(objectId),
  }),
};

export const deleteMember = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    user: Joi.string().required().custom(objectId),
  }),
};

export const updateMember = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    user: Joi.string().required().custom(objectId),
    isLocked: Joi.boolean(),
    live: Joi.string(),
  }),
};

export const duplicateMember = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    user: Joi.string().required().custom(objectId),
  }),
};

export const cancelPlan = {
  params: Joi.object().keys({
    teamId: Joi.string().custom(objectId),
  }),
};
