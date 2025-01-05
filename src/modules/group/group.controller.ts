import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as groupService from './group.service';
import { pick, match } from '../utils';
import { IOptions } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';

export const getGroups = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['hotel']), ...match(req.query, ['name']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await groupService.queryGroups(filter, options);
  res.send(result);
});

export const getGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = toObjectId(req.params['groupId']);
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  res.send(group);
});

export const createGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await groupService.createGroup(req.body);
  res.status(httpStatus.CREATED).send(group);
});

export const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = toObjectId(req.params['groupId']);
  const group = await groupService.updateGroupById(groupId, req.body);
  res.send(group);
});

export const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  const groupId = toObjectId(req.params['groupId']);
  await groupService.deleteGroupById(groupId);
  res.status(httpStatus.NO_CONTENT).send();
});
