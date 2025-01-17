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
  const stats: Record<
    | 'taps'
    | 'views'
    | 'uniqueViews'
    | 'timeSpent'
    | 'returningViews'
    | 'bounceRate'
    | 'engagedViews'
    | 'deviceViews'
    | 'languageViews',
    Record<string, any>
  > = {
    taps: {},
    views: {},
    uniqueViews: {},
    timeSpent: {},
    returningViews: {},
    bounceRate: {},
    engagedViews: {},
    deviceViews: {},
    languageViews: {},
  };

  // Process activities to populate stats
  activities.forEach(({ action, createdAt, details }) => {
    const date = new Date(createdAt).toISOString().split('T')[0];
    if (date && action === 'view') {
      // Initialize date-related stats if not already present
      stats.views[date] = (stats.views[date] || 0) + 1;
      stats.engagedViews[date] = (stats.engagedViews[date] || 0) + (details.engaged ? 1 : 0);
      stats.timeSpent[date] = (stats.timeSpent[date] || 0) + (details.time || 0);
      stats.uniqueViews[date] = stats.uniqueViews[date] || new Set();
      stats.returningViews[date] = stats.returningViews[date] || new Set();

      // Track unique views
      if (details.ip) {
        const uniqueViewIPs = stats.uniqueViews[date] as Set<string>;
        const returningViewIPs = stats.returningViews[date] as Set<string>;

        if (uniqueViewIPs.has(details.ip)) {
          returningViewIPs.add(details.ip); // If IP is already in unique views, it's a returning view
        } else {
          uniqueViewIPs.add(details.ip); // Otherwise, add it to unique views
        }
      }
    }
  });

  stats.uniqueViews = Object.fromEntries(
    Object.entries(stats.uniqueViews).map(([date, ipSet]) => [date, (ipSet as Set<string>).size])
  );
  stats.returningViews = Object.fromEntries(
    Object.entries(stats.returningViews).map(([date, ipSet]) => [date, (ipSet as Set<string>).size])
  );
  stats.bounceRate = Object.fromEntries(
    Object.entries(stats.views).map(([date, totalViews]) => [
      date,
      totalViews > 0 ? ((totalViews - (stats.engagedViews[date] || 0)) / totalViews) * 100 : 0,
    ])
  );

  // Enhance links with tap counts
  const updatedLinks = links.map((link) => ({
    ...link.toJSON(),
    taps: activities.filter((a) => a.action === 'tap' && a.details.link === String(link.id)).length,
  }));

  // Enhance rooms with view counts and time spent
  const updatedRooms = rooms.map((room) => {
    const roomActivities = activities.filter((a) => a.action === 'view' && a.details.room === String(room.id));

    const uniqueViewers = new Set(roomActivities.map((a) => a.details.user));
    const totalViews = roomActivities.length;
    const returningViews = roomActivities.length - uniqueViewers.size;

    const timeSpent = roomActivities.reduce((sum, a) => sum + (a.details.time || 0), 0);

    const bounces = roomActivities.filter((a) => !a.details.engaged).length;

    const bounceRate = totalViews > 0 ? (bounces / totalViews) * 100 : 0;

    return {
      ...room.toJSON(),
      views: totalViews,
      uniqueViews: uniqueViewers.size,
      returningViews,
      timeSpent,
      bounceRate,
    };
  });

  // Enhance links with tap counts
  const updatedSocialLinks = hotel?.socialLinks?.map((link) => ({
    title: link.replace('mailto:', ''),
    taps: activities.filter((a) => a.action === 'tap' && link.includes(a.details.socialLink)).length,
  }));

  stats.deviceViews = activities
    .filter((activity) => activity.action === 'view')
    .reduce<Record<string, number>>((deviceViews, activity) => {
      const device = activity.details.device || 'Android';
      return {
        ...deviceViews,
        [device]: (deviceViews[device] || 0) + 1,
      };
    }, {});

  stats.languageViews = activities
    .filter((activity) => activity.action === 'view')
    .reduce<Record<string, number>>((languageViews, activity) => {
      const language = activity.details.language || 'English';
      return {
        ...languageViews,
        [language]: (languageViews[language] || 0) + 1,
      };
    }, {});

  res.send({
    activities,
    stats,
    links: updatedLinks,
    rooms: updatedRooms,
    socialLinks: updatedSocialLinks,
  });
});
