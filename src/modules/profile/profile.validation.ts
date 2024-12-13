import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedProfile, UpdateProfileBody } from './profile.interfaces';

export const createProfile = {
  body: Joi.object<NewCreatedProfile>({
    user: Joi.required().custom(objectId),
    title: Joi.string().allow(null, ''),
    layout: Joi.string().allow(null),
    image: Joi.string().allow(null, ''),
    cover: Joi.string().allow(null, ''),
    logo: Joi.string().allow(null, ''),
    pronouns: Joi.string().allow(null, ''),
    name: Joi.string(),
    jobTitle: Joi.string().allow(null, ''),
    company: Joi.string().allow(null, ''),
    bio: Joi.string().allow(null, ''),
    theme: Joi.string().allow(null, ''),
    themeLinks: Joi.string().allow(null, ''),
    location: Joi.string().allow(null, ''),
    sectionTitle: Joi.string().allow(null, ''),
    isLeadCapture: Joi.boolean(),
    leadCapture: Joi.object().allow(null),
    isDirect: Joi.boolean(),
    direct: Joi.string().allow(null, ''),
    qrTheme: Joi.string().allow(null, ''),
    qrLogo: Joi.string().allow(null, ''),
  }),
};

export const getProfiles = {
  query: Joi.object().keys({
    user: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getProfile = {
  params: Joi.object().keys({
    profileId: Joi.string(),
  }),
};

export const updateProfile = {
  params: Joi.object().keys({
    profileId: Joi.required().custom(objectId),
  }),
  body: Joi.object<UpdateProfileBody>({
    title: Joi.string().allow(null, ''),
    layout: Joi.string().allow(null),
    image: Joi.string().allow(null, ''),
    cover: Joi.string().allow(null, ''),
    logo: Joi.string().allow(null, ''),
    pronouns: Joi.string().allow(null, ''),
    name: Joi.string(),
    jobTitle: Joi.string().allow(null, ''),
    company: Joi.string().allow(null, ''),
    bio: Joi.string().allow(null, ''),
    theme: Joi.string().allow(null, ''),
    themeLinks: Joi.string().allow(null, ''),
    location: Joi.string().allow(null, ''),
    sectionTitle: Joi.string().allow(null, ''),
    isLeadCapture: Joi.boolean(),
    leadCapture: Joi.object().allow(null),
    isDirect: Joi.boolean(),
    direct: Joi.string().allow(null, ''),
    qrTheme: Joi.string().allow(null, ''),
    qrLogo: Joi.string().allow(null, ''),
  }),
};

export const deleteProfile = {
  params: Joi.object().keys({
    profileId: Joi.string().custom(objectId),
  }),
};

export const getContactCard = {
  params: Joi.object().keys({
    profileId: Joi.string().custom(objectId),
  }),
};

export const getPkPass = {
  params: Joi.object().keys({
    profileId: Joi.string().custom(objectId),
  }),
};
