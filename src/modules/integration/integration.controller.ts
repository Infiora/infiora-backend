import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { ApiError } from '../errors';
import * as mondayService from './monday.service';

// eslint-disable-next-line import/prefer-default-export
export const getBoards = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.integrations) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Integrations not found');
  }

  const integration = req.user.integrations.find((i) => i.key === 'monday');
  if (!integration || !integration.data?.accessToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Monday.com integration not found or missing access token');
  }

  const boards = await mondayService.fetchBoards(integration.data.accessToken);

  res.send(boards);
});
