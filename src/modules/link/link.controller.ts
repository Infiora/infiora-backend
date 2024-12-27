import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as linkService from './link.service';
import { pick, match } from '../utils';
import { IOptions } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';

export const getLinks = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...match(req.query, ['room', 'group', 'title']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await linkService.queryLinks(filter, options);
  res.send(result);
});

export const getLink = catchAsync(async (req: Request, res: Response) => {
  const linkId = toObjectId(req.params['linkId']);
  const link = await linkService.getLinkById(linkId);
  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found');
  }
  res.send(link);
});

export const createLink = catchAsync(async (req: Request, res: Response) => {
  const link = await linkService.createLink(req.body);
  res.status(httpStatus.CREATED).send(link);
});

export const updateLink = catchAsync(async (req: Request, res: Response) => {
  const linkId = toObjectId(req.params['linkId']);
  const link = await linkService.updateLinkById(linkId, req.body);
  res.send(link);
});

export const deleteLink = catchAsync(async (req: Request, res: Response) => {
  const linkId = toObjectId(req.params['linkId']);
  await linkService.deleteLinkById(linkId);
  res.status(httpStatus.NO_CONTENT).send();
});

export const reorderLinks = catchAsync(async (req: Request, res: Response) => {
  const id = toObjectId(req.params['id']);
  await linkService.reorderLinks(id, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});
