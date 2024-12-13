import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as tagService from './tag.service';
import { match, pick } from '../utils';
import { IOptions } from '../paginate/paginate';

export const createTag = catchAsync(async (req: Request, res: Response) => {
  const tag = await tagService.createTag(req.body);
  res.status(httpStatus.CREATED).send(tag);
});

export const getTags = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    ...pick(req.query, ['batch', 'user']),
    ...match(req.query, ['id']),
  };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await tagService.queryTags(filter, options);
  res.send(result);
});

export const getTag = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['tagId'] === 'string') {
    let tag = await tagService.getTagByCustomId(req.params['tagId']);
    if (!tag) {
      tag = await tagService.getTagById(new mongoose.Types.ObjectId(req.params['tagId']));
    }
    if (!tag) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
    }
    res.send(tag);
  }
});

export const updateTag = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['tagId'] === 'string') {
    const tag = await tagService.updateTagById(new mongoose.Types.ObjectId(req.params['tagId']), req.body);
    res.send(tag);
  }
});

export const deleteTag = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['tagId'] === 'string') {
    await tagService.deleteTagById(new mongoose.Types.ObjectId(req.params['tagId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const getMyTags = catchAsync(async (req: Request, res: Response) => {
  const filter = match(req.query, ['name']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  filter.user = req.user.id;
  const result = await tagService.queryTags(filter, options);
  res.send(result);
});

export const linkTag = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['tagId'] === 'string') {
    const userId = req.query['user'] ? req.query['user'].toString() : req.user.id;
    const tag = await tagService.linkTagById(
      req.params['tagId'],
      new mongoose.Types.ObjectId(userId),
      req.query['type'] ? req.query['type'].toString() : 'card'
    );
    res.send(tag);
  }
});

export const unlinkTag = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['tagId'] === 'string') {
    const tag = await tagService.unlinkTagById(new mongoose.Types.ObjectId(req.params['tagId']));
    res.send(tag);
  }
});

export const exportTags = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['batch', 'user']);
  const tags = await tagService.exportTags(filter);
  res.set('Content-Type', `text/csv; name="tags.csv"`);
  res.set('Content-Disposition', `inline; filename="tags.csv"`);
  res.send(tags);
});
