import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as supportService from './support.service';
import { pick } from '../utils';
import { IOptions } from '../paginate/paginate';
import { emailService } from '../email';

export const createSupport = catchAsync(async (req: Request, res: Response) => {
  const support = await supportService.createSupport({ user: req.user.id, ...req.body });
  await emailService.sendSupportEmail(support);
  res.status(httpStatus.CREATED).send(support);
});

export const getSupports = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['profile']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await supportService.querySupports(filter, options);
  res.send(result);
});

export const getSupport = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['supportId'] === 'string') {
    const support = await supportService.getSupportById(new mongoose.Types.ObjectId(req.params['supportId']));
    if (!support) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Support not found');
    }
    res.send(support);
  }
});

export const updateSupportById = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['supportId'] === 'string') {
    const support = await supportService.updateSupportById(new mongoose.Types.ObjectId(req.params['supportId']), req.body);
    res.send(support);
  }
});

export const deleteSupport = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['supportId'] === 'string') {
    await supportService.deleteSupportById(new mongoose.Types.ObjectId(req.params['supportId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});
