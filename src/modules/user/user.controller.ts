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
import { Activity } from '../activity';
import { toDate } from '../utils/miscUtils';
import { Group } from '../group';
import { Hotel } from '../hotel';

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
  // Extract query parameters
  const { hotel: hotelId } = pick(req.query, ['hotel']);
  const { startDate, endDate } = pick(req.query, ['startDate', 'endDate']);
  const { start, end } = toDate({ startDate, endDate });
  const hotel = await Hotel.findById(hotelId);
  // Fetch rooms and groups for the specified hotel
  const [rooms, groups] = await Promise.all([Room.find({ hotel: hotelId }), Group.find({ hotel: hotelId })]);

  const roomIds = rooms.map((r) => r.id);
  const groupIds = groups.map((g) => g.id);

  // Fetch links and activities concurrently
  const [links, activities] = await Promise.all([
    Link.find({
      $or: [{ room: { $in: roomIds } }, { group: { $in: groupIds } }],
    }).populate('room'),
    Activity.find({
      user: req.user.id,
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 }),
  ]);

  // Initialize stats object
  const stats: Record<'taps' | 'views' | 'uniqueViews' | 'timeSpent', Record<string, any>> = {
    taps: {},
    views: {},
    uniqueViews: {},
    timeSpent: {},
  };

  // Process activities to populate stats
  activities.forEach(({ action, createdAt, details }) => {
    const date = new Date(createdAt).toISOString().split('T')[0];
    if (date) {
      // Populate generic action-based stats
      stats[`${action}s`][date] = (stats[`${action}s`][date] || 0) + 1;
      // Handle timeSpent aggregation
      if (action === 'view' && details.time) {
        stats.timeSpent[date] = (stats.timeSpent[date] || 0) + Number(details.time);
      }
      // Unique views by IP
      if (action === 'view' && details.ip) {
        stats.uniqueViews[date] = stats.uniqueViews[date] || new Set();
        (stats.uniqueViews[date] as Set<string>).add(details.ip);
      }
    }
  });

  stats.uniqueViews = Object.fromEntries(
    Object.entries(stats.uniqueViews).map(([date, ips]) => [date, (ips as Set<string>).size])
  );

  // Enhance links with tap counts
  const updatedLinks = links.map((link) => ({
    ...link.toJSON(),
    taps: activities.filter((a) => a.action === 'tap' && a.details.link === String(link.id)).length,
  }));

  // Enhance rooms with view counts and time spent
  const updatedRooms = rooms.map((room) => ({
    ...room.toJSON(),
    views: activities.filter((a) => a.action === 'view' && a.details.room === String(room.id)).length,
    timeSpent: activities
      .filter((a) => a.action === 'view' && a.details.room === String(room.id))
      .reduce((sum, a) => sum + Number(a.details.time || 0), 0)
      .toFixed(0),
  }));

  // Enhance links with tap counts
  const updatedSocialLinks = hotel?.socialLinks?.map((link) => ({
    title: link.replace('mailto:', ''),
    taps: activities.filter((a) => a.action === 'tap' && link.includes(a.details.socialLink)).length,
  }));

  res.send({
    activities,
    stats,
    links: updatedLinks,
    rooms: updatedRooms,
    socialLinks: updatedSocialLinks,
  });
});
