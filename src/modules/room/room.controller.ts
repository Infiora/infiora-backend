import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as roomService from './room.service';
import { pick, match } from '../utils';
import { IOptions } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';
import { Activity } from '../activity';

export const getRooms = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['hotel']), ...match(req.query, ['name', 'number']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await roomService.queryRooms(filter, options);
  res.send(result);
});

export const getRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = toObjectId(req.params['roomId']);
  const { action, activityId, ...details } = pick(req.query, [
    'action',
    'activityId',
    'visitorId',
    'time',
    'device',
    'engaged',
    'language',
  ]);
  const room = await roomService.getRoom(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  let activity;
  if (action) {
    activity = await Activity.create({
      user: room.hotel.user,
      action,
      details: {
        image: room.hotel.image,
        title: room.hotel.name,
        headline: `Room ${room.number} was viewed.`,
        room: room.id,
        ...details,
      },
    });
  }
  if (activityId && details) {
    await Activity.findByIdAndUpdate(activityId, {
      $set: {
        'details.engaged': details.engaged,
        'details.language': details.language,
        'details.time': details.time,
      },
    });
  }
  res.send({ ...room, activityId: activity?.id });
});

export const createRoom = catchAsync(async (req: Request, res: Response) => {
  const room = await roomService.createRoom(req.body);
  res.status(httpStatus.CREATED).send(room);
});

export const updateRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = toObjectId(req.params['roomId']);
  const room = await roomService.updateRoomById(roomId, req.body);
  res.send(room);
});

export const deleteRoom = catchAsync(async (req: Request, res: Response) => {
  const roomId = toObjectId(req.params['roomId']);
  await roomService.deleteRoomById(roomId);
  res.status(httpStatus.NO_CONTENT).send();
});
