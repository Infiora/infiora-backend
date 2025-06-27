import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as roomService from './room.service';
import * as feedbackService from '../feedback/feedback.service';
import { pick, match } from '../utils';
import { IOptions } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';
import { Activity } from '../activity';
import { toDate } from '../utils/miscUtils';

export const getRooms = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['hotel']), ...match(req.query, ['name', 'number', '_id']) };
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
      hotel: room.hotel.id,
      action,
      details: {
        image: room.hotel.image,
        title: room.hotel.name,
        headline: `Room ${room.number || ''} was viewed.`,
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
  const room = await roomService.createRoom({ ...req.body, isActive: req.user.role === 'admin' });
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

export const getFeedbacks = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = pick(req.query, ['startDate', 'endDate']);
  const { start, end } = toDate({ startDate, endDate });
  const filter = {
    ...pick(req.query, ['room', 'hotel']),
    createdAt: { $gte: start, $lte: end },
  };

  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await feedbackService.queryFeedbacks(filter, options);
  res.send(result);
});

export const createFeedback = catchAsync(async (req: Request, res: Response) => {
  const feedback = await feedbackService.createFeedback(req.body);
  const room = await roomService.getRoomById(req.body.room);
  await Activity.create({
    user: room?.hotel?.user,
    hotel: room?.hotel?.id,
    room: req.body.room,
    action: 'feedback',
    details: {
      image: room?.hotel?.image,
      title: room?.hotel?.name,
      headline: `Feedback on room ${room?.number || ''}.`,
      room: room?.id,
      goodness: req.body.goodness,
    },
  });

  res.status(httpStatus.CREATED).send(feedback);
});
