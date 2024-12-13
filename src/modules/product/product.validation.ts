import Joi from 'joi';
import { objectId } from '../validate/custom.validation';
import { NewCreatedProduct, UpdateProductBody } from './product.interfaces';

const objectIdSchema = Joi.string().custom(objectId);

const createProductBody: Record<keyof NewCreatedProduct, Joi.Schema> = {
  profile: objectIdSchema,
  template: objectIdSchema,
  title: Joi.string(),
  image: Joi.any(),
  description: Joi.string(),
  url: Joi.string(),
  price: Joi.string(),
};

const updateProductBody: Record<keyof UpdateProductBody, Joi.Schema> = {
  title: Joi.string(),
  image: Joi.any(),
  description: Joi.string(),
  url: Joi.string(),
  price: Joi.string(),
  isActive: Joi.boolean(),
};

export const getProducts = {
  query: Joi.object({
    profile: objectIdSchema,
    template: objectIdSchema,
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

export const getProduct = {
  params: Joi.object({
    productId: objectIdSchema.required(),
  }),
  query: Joi.object({
    isTapped: Joi.boolean().optional(),
    profile: objectIdSchema.optional(),
  }),
};

export const createProduct = {
  body: Joi.object(createProductBody),
};

export const updateProduct = {
  params: Joi.object({
    productId: objectIdSchema.required(),
  }),
  body: Joi.object(updateProductBody),
};

export const deleteProduct = {
  params: Joi.object({
    productId: objectIdSchema.required(),
  }),
};

export const reorderProducts = {
  params: Joi.object({
    profileId: objectIdSchema.required(),
  }),
  body: Joi.object({
    orderedProducts: Joi.array().items(objectIdSchema).required(),
  }),
};
