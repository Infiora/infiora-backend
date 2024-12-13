import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as templateService from './template.service';
import match from '../utils/match';

export const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = await templateService.createTemplate({ ...req.body, team: req.user.team }, req.files);
  res.status(httpStatus.CREATED).send(template);
});

export const getTemplates = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['team']), ...match(req.query, ['title']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await templateService.queryTemplates(filter, options);
  res.send(result);
});

export const getTemplate = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['templateId'] === 'string') {
    const templateId = new mongoose.Types.ObjectId(req.params['templateId']);
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    }
    res.send(template);
  }
});

export const updateTemplate = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['templateId'] === 'string') {
    const templateId = new mongoose.Types.ObjectId(req.params['templateId']);
    const template = await templateService.updateTemplateById(templateId, req.body, req.files);
    res.send(template);
  }
});

export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['templateId'] === 'string') {
    const templateId = new mongoose.Types.ObjectId(req.params['templateId']);
    await templateService.deleteTemplateById(templateId);
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const duplicateTemplate = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    const templateId = new mongoose.Types.ObjectId(req.params['templateId']);
    const template = await templateService.duplicateTemplate(templateId);
    res.status(httpStatus.CREATED).send(template);
  }
});
