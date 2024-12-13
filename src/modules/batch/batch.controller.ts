import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as batchService from './batch.service';
import { match, pick } from '../utils';
import { IOptions } from '../paginate/paginate';

export const createBatch = catchAsync(async (req: Request, res: Response) => {
  const batch = await batchService.createBatch(req.body);
  res.status(httpStatus.CREATED).send(batch);
});

export const getBatches = catchAsync(async (req: Request, res: Response) => {
  const filter = match(req.query, ['name']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await batchService.queryBatches(filter, options);
  res.send(result);
});

export const getBatch = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['batchId'] === 'string') {
    const batch = await batchService.getBatchById(new mongoose.Types.ObjectId(req.params['batchId']));
    if (!batch) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
    }
    res.send(batch);
  }
});

export const updateBatch = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['batchId'] === 'string') {
    const batch = await batchService.updateBatchById(new mongoose.Types.ObjectId(req.params['batchId']), req.body);
    res.send(batch);
  }
});

export const deleteBatch = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['batchId'] === 'string') {
    await batchService.deleteBatchById(new mongoose.Types.ObjectId(req.params['batchId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});
