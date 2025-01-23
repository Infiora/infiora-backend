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
import { IHotelDoc } from '../hotel/hotel.interfaces';
import { IActivity } from '../activity/activity.interfaces';
import { IRoomDoc } from '../room/room.interfaces';
import { ILinkDoc } from '../link/link.interfaces';

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

const getCounts = (activities: IActivity[], field: string) => {
  const counts = activities.reduce<Record<string, number>>((acc, activity) => {
    const key = activity.details[field] || 'Others';

    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {});
  return counts;
};

const calculateStatsOverTime = (activities: IActivity[]) => {
  const stats: Record<
    'taps' | 'views' | 'uniqueViews' | 'timeSpent' | 'returningViews' | 'bounceRate' | 'engagedViews',
    Record<string, any>
  > = {
    taps: {},
    views: {},
    uniqueViews: {},
    timeSpent: {},
    returningViews: {},
    bounceRate: {},
    engagedViews: {},
  };

  const uniqueViewsTracker: Record<string, Set<string>> = {};

  activities.forEach(({ action, createdAt, details }) => {
    const date = new Date(createdAt).toISOString().split('T')[0];

    if (!date) return;

    if (action === 'view') {
      stats.views[date] = (stats.views[date] || 0) + 1;
      stats.engagedViews[date] = (stats.engagedViews[date] || 0) + (details.engaged ? 1 : 0);
      stats.timeSpent[date] = (stats.timeSpent[date] || 0) + (details.time || 0);

      const ip = details.ip || '';

      if (!uniqueViewsTracker[date]) {
        uniqueViewsTracker[date] = new Set();
      }

      uniqueViewsTracker[date]!.add(ip);
    } else if (action === 'tap') {
      stats.taps[date] = (stats.taps[date] || 0) + 1;
    }
  });

  stats.uniqueViews = Object.fromEntries(Object.entries(uniqueViewsTracker).map(([date, ipSet]) => [date, ipSet.size]));
  stats.returningViews = Object.fromEntries(Object.entries(uniqueViewsTracker).map(([date, ipSet]) => [date, ipSet.size]));

  stats.bounceRate = Object.fromEntries(
    Object.entries(stats.views).map(([date, totalViews]) => [
      date,
      totalViews > 0 ? ((totalViews - (stats.engagedViews[date] || 0)) / totalViews) * 100 : 0,
    ])
  );

  return stats;
};

const enrichLinksWithStats = (links: ILinkDoc[], activities: IActivity[]) => {
  const tapActivities = activities.filter((a) => a.action === 'tap');

  return links.map((link) => {
    const tapCount = tapActivities.filter((a) => a.details.link === link.id).length;

    return { ...link.toJSON(), taps: tapCount };
  });
};

const enrichRoomsWithStats = (rooms: IRoomDoc[], activities: IActivity[]) => {
  const viewActivities = activities.filter((a) => a.action === 'view');

  return rooms.map((room) => {
    const roomActivities = viewActivities.filter((a) => a.details.room === room.id);
    const uniqueViewers = new Set(roomActivities.map((a) => a.details.ip));
    const totalViews = roomActivities.length;
    const returningViews = totalViews - uniqueViewers.size;
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
      viewsByLanguages: getCounts(roomActivities, 'language'),
      viewsByDevices: getCounts(roomActivities, 'device'),
    };
  });
};

const enrichSocialLinksWithStats = (hotel: IHotelDoc, activities: IActivity[]) => {
  const tapActivities = activities.filter((a) => a.action === 'tap');

  return hotel?.socialLinks?.map((link) => {
    const socialLinkTaps = tapActivities.filter((a) => link.includes(a.details.socialLink || '')).length;

    return {
      title: link.replace('mailto:', ''),
      taps: socialLinkTaps,
    };
  });
};

const getStats = ({
  hotel,
  rooms,
  links,
  activities,
}: {
  hotel: IHotelDoc;
  rooms: IRoomDoc[];
  links: ILinkDoc[];
  activities: IActivity[];
}) => {
  const overTime = calculateStatsOverTime(activities);
  const updatedLinks = enrichLinksWithStats(links, activities);
  const updatedRooms = enrichRoomsWithStats(rooms, activities);
  const updatedSocialLinks = enrichSocialLinksWithStats(hotel, activities);

  const viewActivities = activities.filter((a) => a.action === 'view');
  const tapActivities = activities.filter((a) => a.action === 'tap');
  const views = viewActivities.length;
  const engagedViews = viewActivities.filter((a) => a.details.engaged).length;
  const taps = tapActivities.length;
  const uniqueViews = new Set(viewActivities.map(({ details }) => details.ip || '')).size;
  const returningViews = views - uniqueViews;
  const timeSpent = viewActivities.reduce((sum, { details }) => sum + (details.time || 0), 0);
  const bounceRate = views > 0 ? ((views - engagedViews) / views) * 100 : 0;
  const topRoom: any = updatedRooms.reduce((max, current) => (current.views > (max.views || 0) ? current : max));
  const topLink: any = updatedLinks.reduce((max, current) => (current.taps > (max.taps || 0) ? current : max));

  return {
    stats: {
      overTime,
      topPerforming: {
        room: `Room ${topRoom?.number}`,
        link: topLink.title,
      },
      viewsByLanguages: getCounts(activities, 'language'),
      viewsByDevices: getCounts(activities, 'device'),
      views,
      taps,
      uniqueViews,
      returningViews,
      timeSpent,
      bounceRate,
    },
    links: updatedLinks,
    rooms: updatedRooms,
    socialLinks: updatedSocialLinks,
  };
};

export const getInsights = catchAsync(async (req: Request, res: Response) => {
  // Extract query parameters
  const { hotel: hotelId } = pick(req.query, ['hotel']);
  const { startDate, endDate } = pick(req.query, ['startDate', 'endDate']);
  const { start, end } = toDate({ startDate, endDate });
  const hotel = await Hotel.findById(hotelId);

  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }

  // Fetch rooms and groups for the specified hotel
  const [rooms, groups] = await Promise.all([
    Room.find({ hotel: hotelId }).populate('group'),
    Group.find({ hotel: hotelId }),
  ]);

  const roomIds = rooms.map((r) => r.id);
  const groupIds = groups.map((g) => g.id);

  // Fetch links and activities concurrently
  const [links, activities] = await Promise.all([
    Link.find({
      $or: [{ room: { $in: roomIds } }, { group: { $in: groupIds } }],
    })
      .populate('room')
      .populate('group'),
    Activity.find({
      user: req.user.id,
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 }),
  ]);

  const stats = getStats({
    hotel,
    activities,
    links,
    rooms,
  });

  res.send({
    ...stats,
    activities,
  });
});
