import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as productService from './product.service';
import { pick } from '../utils';
import { IOptions } from '../paginate/paginate';
import { profileService } from '../profile';
import { Activity } from '../activity';
import { userService } from '../user';

const validateProfile = async (profileId: mongoose.Types.ObjectId) => {
  const userProfile = await profileService.getProfileById(profileId);
  if (!userProfile) throw new ApiError(httpStatus.BAD_REQUEST, 'Profile not found.');
  return userProfile;
};

const validateUser = async (userId: mongoose.Types.ObjectId) => {
  const user = await userService.getUserById(userId);
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found.');
  return user;
};

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const { profile, template } = pick(req.query, ['profile', 'template']);
  const userProfile = profile ? await profileService.getProfileById(profile) : undefined;
  const user = userProfile ? await validateUser(userProfile.user) : undefined;

  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const filter = {
    $or: [
      profile ? { profile } : null,
      template ? { template } : null,
      user?.template ? { template: user.template.id } : null,
    ].filter(Boolean),
  };

  const result = await productService.queryProducts(filter, options);
  res.send(result);
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const product = await productService.getProductById(new mongoose.Types.ObjectId(productId));
  if (!product) throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');

  const { profile } = pick(req.query, ['profile']);
  if (profile) {
    const userProfile = await validateProfile(profile);
    if (userProfile) {
      await Activity.create({
        user: userProfile.user,
        action: 'tap',
        description: `${userProfile.name}'s ${product.title || ''} was tapped`,
        details: { image: userProfile.image, name: userProfile.name, productId: product.id },
      });
    }
  }

  res.send(product);
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body, req.file);
  res.status(httpStatus.CREATED).send(product);
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const product = await productService.updateProductById(new mongoose.Types.ObjectId(productId), req.body, req.file);
  res.send(product);
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  await productService.deleteProductById(new mongoose.Types.ObjectId(productId));
  res.status(httpStatus.NO_CONTENT).send();
});

export const reorderProducts = catchAsync(async (req: Request, res: Response) => {
  const { profileId } = req.params;
  await productService.reorderProducts(new mongoose.Types.ObjectId(profileId), req.body);
  res.status(httpStatus.NO_CONTENT).send();
});
