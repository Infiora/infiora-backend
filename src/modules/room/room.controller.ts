import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as roomService from './room.service';
import { pick, match } from '../utils';
import { IOptions } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';

export const getRooms = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['hotel']), ...match(req.query, ['name', 'number']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await roomService.queryRooms(filter, options);
  res.send(result);
});

export const getRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = toObjectId(req.params['roomId']);
  const { action } = pick(req.query, ['action']);
  const room = await roomService.getRoom(roomId, action);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  res.send(room);
});

export const createRoom = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const room = await roomService.createRoom(req.body, files);
  res.status(httpStatus.CREATED).send(room);
});

export const updateRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = toObjectId(req.params['roomId']);
  const files = req.files as Express.Multer.File[];
  const room = await roomService.updateRoomById(roomId, req.body, files);
  res.send(room);
});

export const deleteRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = toObjectId(req.params['roomId']);
  await roomService.deleteRoomById(roomId);
  res.status(httpStatus.NO_CONTENT).send();
});
