import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as platformService from './platform.service';
import { IOptions } from '../paginate/paginate';
import { pick, match } from '../utils';

export const createPlatform = catchAsync(async (req: Request, res: Response) => {
  const platform = await platformService.createPlatform(req.body, req.file);
  res.status(httpStatus.CREATED).send(platform);
});

export const getPlatforms = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['category']), ...match(req.query, ['title']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await platformService.queryPlatforms(filter, options);
  res.send(result);
});

export const getPlatform = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['platformId'] === 'string') {
    const platform = await platformService.getPlatformById(new mongoose.Types.ObjectId(req.params['platformId']));
    if (!platform) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
    }
    res.send(platform);
  }
});

export const updatePlatform = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['platformId'] === 'string') {
    const platform = await platformService.updatePlatformById(
      new mongoose.Types.ObjectId(req.params['platformId']),
      req.body,
      req.file
    );
    res.send(platform);
  }
});

export const deletePlatform = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['platformId'] === 'string') {
    await platformService.deletePlatformById(new mongoose.Types.ObjectId(req.params['platformId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});
