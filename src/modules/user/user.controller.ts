import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as userService from './user.service';
import { match } from '../utils';
import { toObjectId } from '../utils/mongoUtils';
import { Room } from '../room';
import { Link } from '../link';
import Tag from '../tag/tag.model';
import { Activity } from '../activity';
import { toDate } from '../utils/miscUtils';

export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  res.send(req.user);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['role']), ...match(req.query, ['name', 'email']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = toObjectId(req.params['userId']);
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

export const updateUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = toObjectId(req.params['userId']);
  const user = await userService.updateUserById(userId, req.body);
  res.send(user);
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const user = await userService.updateUserById(userId, req.body);
  res.send(user);
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = toObjectId(req.params['userId']);
  await userService.deleteUserById(userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export const getInsights = catchAsync(async (req: Request, res: Response) => {
  const { hotel } = pick(req.query, ['hotel']);
  const dates = pick(req.query, ['startDate', 'endDate', 'hotel']);

  const { start, end } = toDate(dates);

  const rooms = await Room.find({ hotel });
  const roomIds = rooms.map((r) => r.id);
  // Fetch links and activities
  const [links, tags, activities] = await Promise.all([
    Link.find({ room: { $in: roomIds } }).populate([{ path: 'room' }]),
    Tag.find({ room: { $in: roomIds } }),
    Activity.find({ user: { $in: req.user.id }, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
  ]);

  // Initialize stats object
  const stats: Record<string, Record<string, number>> = {
    tap: {},
    view: {},
  };

  activities
    .filter((a) => a.details.room)
    .forEach(({ action, createdAt }) => {
      const date = new Date(createdAt).toISOString().split('T')[0];
      if (date && stats[action]) {
        stats[action]![date] = (stats[action]![date] || 0) + 1;
      }
    });

  const updatedLinks = links.map((link) => ({
    ...link.toJSON(),
    taps: activities.reduce((sum, activity) => {
      return activity.action === 'tap' && activity.details.link.id === link.id ? sum + 1 : sum;
    }, 0),
  }));

  const updatedTags = tags.map((tag) => ({
    ...tag.toJSON(),
    taps: activities.reduce((sum, activity) => {
      return activity.action === 'tap' && activity.details.tag.id === tag.id ? sum + 1 : sum;
    }, 0),
  }));

  res.send({
    activities,
    stats,
    links: updatedLinks,
    tags: updatedTags,
  });
});
