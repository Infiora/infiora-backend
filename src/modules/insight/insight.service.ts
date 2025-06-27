/* eslint-disable import/prefer-default-export */
import { Activity } from '../activity';
import { IActivity } from '../activity/activity.interfaces';
import { Group } from '../group';
import Hotel from '../hotel/hotel.model';
import { IHotelDoc } from '../hotel/hotel.interfaces';
import { Link } from '../link';
import { ILinkDoc } from '../link/link.interfaces';
import { Room } from '../room';
import { IRoomDoc } from '../room/room.interfaces';
import { toDate } from '../utils/miscUtils';

const getCounts = (activities: IActivity[], field: string): Record<string, number> => {
  if (activities.length === 0) return {};

  const counts = activities.reduce<Record<string, number>>((acc, activity) => {
    const key = activity.details[field] || 'Others';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topThree = sortedEntries.slice(0, 3);
  const othersCount = sortedEntries.slice(3).reduce((sum, [, count]) => sum + count, 0);

  const finalCounts = Object.fromEntries(topThree);
  if (othersCount > 0) {
    finalCounts['Others'] = othersCount;
  }

  const total = Object.values(finalCounts).reduce((sum, count) => sum + count, 0);
  if (total === 0) return {};

  return Object.fromEntries(
    Object.entries(finalCounts).map(([key, count]) => [key, Number(((count / total) * 100).toFixed(2))])
  );
};

const calculateStatsOverTime = (activities: IActivity[]) => {
  const stats: any = {
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

    stats.views[date] = (stats.views[date] || 0) + (action === 'view' ? 1 : 0);
    stats.engagedViews[date] = (stats.engagedViews[date] || 0) + (action === 'view' && details.engaged ? 1 : 0);
    stats.timeSpent[date] = (stats.timeSpent[date] || 0) + (action === 'view' ? Number(details.time || 0) : 0);

    const visitorId = details.visitorId || '';
    if (!uniqueViewsTracker[date]) uniqueViewsTracker[date] = new Set();
    uniqueViewsTracker[date]!.add(visitorId);

    if (action === 'tap') {
      stats.taps[date] = (stats.taps[date] || 0) + 1;
    }
  });

  stats.uniqueViews = Object.fromEntries(Object.entries(uniqueViewsTracker).map(([date, ipSet]) => [date, ipSet.size]));
  stats.returningViews = stats.uniqueViews;

  stats.bounceRate = Object.fromEntries(
    Object.entries(stats.views).map(([date, totalViews]) => [
      date,
      Number(totalViews) > 0 ? ((Number(totalViews) - (stats.engagedViews[date] || 0)) / Number(totalViews)) * 100 : 0,
    ])
  );

  return stats;
};

const getKeyMetrics = (activities: IActivity[]) => {
  const oneMinuteAgo = new Date().getTime() - 60 * 1000;

  const viewActivities = activities.filter((a) => a.action === 'view');
  const recentActivities = viewActivities.filter((a) => new Date(a.updatedAt).getTime() > oneMinuteAgo);
  const tapActivities = activities.filter((a) => a.action === 'tap');
  const feedbackActivities = activities.filter((a) => a.action === 'feedback');

  const views = viewActivities.length;
  const liveViews = recentActivities.length;
  const engagedViews = viewActivities.filter((a) => a.details.engaged).length;
  const taps = tapActivities.length;
  const feedbacks = feedbackActivities.length;

  const uniqueViews = new Set(viewActivities.map(({ details }) => details.visitorId || '')).size;
  const returningViews = views - uniqueViews;
  const timeSpent: number =
    views > 0
      ? Number((viewActivities.reduce((sum, { details }) => sum + Number(details.time || 0), 0) / views).toFixed(0))
      : 0;
  const bounceRate: number = views > 0 ? Number((((views - engagedViews) / views) * 100).toFixed(0)) : 0;

  const links: Record<string, number> = {};
  tapActivities.forEach((a) => {
    const id: string | undefined = a.details.link;
    if (id) {
      links[id] = (links[id] || 0) + 1;
    }
  });
  const topPerformingLink =
    Object.keys(links).length > 0
      ? Object.keys(links).reduce((maxId, id) => {
          return links[maxId] && links[id]! > links[maxId]! ? id : maxId;
        }, Object.keys(links)[0] || '')
      : null;

  const socialLinks: Record<string, number> = {};
  tapActivities.forEach((a) => {
    const id: string | undefined = a.details.socialLink;
    if (id) {
      socialLinks[id] = (socialLinks[id] || 0) + 1;
    }
  });

  const topPerformingSocialLink =
    Object.keys(socialLinks).length > 0
      ? Object.keys(socialLinks).reduce((maxId, id) => {
          return socialLinks[maxId] && socialLinks[id]! > socialLinks[maxId]! ? id : maxId;
        }, Object.keys(socialLinks)[0] || '')
      : null;

  return {
    views,
    liveViews,
    taps,
    feedbacks,
    uniqueViews,
    returningViews,
    timeSpent,
    bounceRate,
    viewsByLanguages: getCounts(viewActivities, 'language'),
    viewsByDevices: getCounts(viewActivities, 'device'),
    topPerformingLink,
    topPerformingSocialLink,
  };
};

const enrichRoomsWithStats = (rooms: IRoomDoc[], activities: IActivity[]) => {
  return rooms.map((room) => {
    const roomActivities = activities.filter((a) => a.details.room === room.id);
    const keyMetrics = getKeyMetrics(roomActivities);
    return { ...room.toJSON(), ...keyMetrics };
  });
};

const enrichLinksWithStats = (links: ILinkDoc[], activities: IActivity[]) => {
  const tapActivities = activities.filter((a) => a.action === 'tap');
  return links.map((link) => {
    const tapCount = tapActivities.filter((a) => a.details.link === link.id).length;
    return { ...link.toJSON(), taps: tapCount };
  });
};

const enrichSocialLinksWithStats = (socialLinks: string[], activities: IActivity[]) => {
  const tapActivities = activities.filter((a) => a.action === 'tap');
  return socialLinks?.map((link) => {
    const socialLinkTaps = tapActivities.filter((a) => link.includes(a.details.socialLink || '')).length;
    return { title: link.replace('mailto:', ''), taps: socialLinkTaps };
  });
};

const calculateChange = (current: any, previous: any) => {
  const calculatePercentage = (currentValue: number, previousValue: number): number => {
    if (previousValue === 0) return currentValue === 0 ? 0 : 100; // Handle division by zero
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  return {
    views: calculatePercentage(current.views, previous.views),
    liveViews: calculatePercentage(current.liveViews, previous.liveViews),
    taps: calculatePercentage(current.taps, previous.taps),
    uniqueViews: calculatePercentage(current.uniqueViews, previous.uniqueViews),
    returningViews: calculatePercentage(current.returningViews, previous.returningViews),
    timeSpent: calculatePercentage(current.timeSpent, previous.timeSpent),
    bounceRate: calculatePercentage(current.bounceRate, previous.bounceRate),
  };
};

export const getHotelInsights = async ({
  hotel,
  startDate,
  endDate,
  language,
  device,
}: {
  hotel: IHotelDoc;
  startDate: string;
  endDate: string;
  language: string;
  device: string;
}) => {
  const { start, end } = toDate({ startDate, endDate });
  const timeSpan = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - timeSpan - 1);
  const prevEnd = new Date(end.getTime() - timeSpan - 1);

  const pastStart = new Date(end);
  pastStart.setDate(end.getDate() - 6);

  // Fetch data concurrently
  const [rooms, groups] = await Promise.all([
    Room.find({ hotel: hotel.id }).populate('group'),
    Group.find({ hotel: hotel.id }),
  ]);

  const roomIds = rooms.map((r) => r.id);
  const groupIds = groups.map((g) => g.id);

  // Fetch links and activities concurrently
  const [links, activities] = await Promise.all([
    Link.find({ $or: [{ room: { $in: roomIds } }, { group: { $in: groupIds } }] })
      .populate('room')
      .populate('group'),
    Activity.find({
      user: hotel.user,
      hotel: hotel.id,
      createdAt: { $gte: start, $lte: end },
      ...(language && { 'details.language': language }),
      ...(device && { 'details.device': device }),
    }).sort({ createdAt: -1 }),
  ]);

  const prevActivities = await Activity.find({
    user: hotel.user,
    hotel: hotel.id,
    createdAt: { $gte: prevStart, $lte: prevEnd },
    ...(language && { 'details.language': language }),
    ...(device && { 'details.device': device }),
  }).sort({ createdAt: -1 });

  const pastActivities =
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24) < 2
      ? await Activity.find({
          user: hotel.user,
          hotel: hotel.id,
          createdAt: { $gte: pastStart, $lte: end },
          ...(language && { 'details.language': language }),
          ...(device && { 'details.device': device }),
        }).sort({ createdAt: -1 })
      : [];

  const keyMetrics = getKeyMetrics(activities);
  const updatedLinks = enrichLinksWithStats(links, activities);
  const updatedRooms = enrichRoomsWithStats(rooms, activities);
  const updatedSocialLinks = enrichSocialLinksWithStats(hotel.socialLinks || [], activities);

  const prevKeyMetrics = getKeyMetrics(prevActivities);
  const change = calculateChange(keyMetrics, prevKeyMetrics);

  const overTime = calculateStatsOverTime(pastActivities.length > 0 ? pastActivities : activities);

  const topRoom: any =
    updatedRooms.length > 0
      ? updatedRooms.reduce((max, current) => (current.views > (max.views || 0) ? current : max))
      : null;
  const topLink: any =
    updatedLinks.length > 0 ? updatedLinks.reduce((max, current) => (current.taps > (max.taps || 0) ? current : max)) : null;

  return {
    keyMetrics,
    links: updatedLinks,
    rooms: updatedRooms,
    socialLinks: updatedSocialLinks,
    overTime,
    change,
    activities,
    topRoom,
    topLink,
  };
};

const enrichHotelsWithStats = (hotels: IHotelDoc[], activities: IActivity[]) => {
  return hotels.map((hotel) => {
    const hotelActivities = activities.filter((a) => String(a.hotel) === String(hotel.id));
    const viewActivities = hotelActivities.filter((a) => a.action === 'view');
    const views = viewActivities.length;

    const redirectActivities = hotelActivities.filter((a) => a.details.logo);
    const redirects = redirectActivities.length;

    return {
      ...hotel.toJSON(),
      views,
      redirects,
    };
  });
};

export const getAdminInsights = async ({
  startDate,
  endDate,
  reqUser,
}: {
  startDate: string;
  endDate: string;
  reqUser: any;
}) => {
  const { start, end } = toDate({ startDate, endDate });
  const timeSpan = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - timeSpan - 1);
  const prevEnd = new Date(end.getTime() - timeSpan - 1);

  const pastStart = new Date(end);
  pastStart.setDate(end.getDate() - 6);

  const filter = reqUser.role === 'manager' ? { manager: reqUser.id } : {};
  const hotels = await Hotel.find(filter);
  const hotelIds = hotels.map((h) => h.id);

  // Fetch rooms and groups for the specified hotel
  const [rooms, groups] = await Promise.all([Room.find({ hotel: { $in: hotelIds } }).populate('group'), Group.find({})]);

  const roomIds = rooms.map((r) => r.id);
  const groupIds = groups.map((g) => g.id);

  // Fetch links and activities concurrently
  const [links, activities] = await Promise.all([
    Link.find({ $or: [{ room: { $in: roomIds } }, { group: { $in: groupIds } }] })
      .populate('room')
      .populate('group'),
    Activity.find({
      hotel: { $in: hotelIds },
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 }),
  ]);

  const prevActivities = await Activity.find({
    hotel: { $in: hotelIds },
    createdAt: { $gte: prevStart, $lte: prevEnd },
  }).sort({ createdAt: -1 });

  const pastActivities =
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24) < 2
      ? await Activity.find({
          hotel: { $in: hotelIds },
          createdAt: { $gte: pastStart, $lte: end },
        }).sort({ createdAt: -1 })
      : [];

  const keyMetrics = getKeyMetrics(activities);
  const updatedLinks = enrichLinksWithStats(links, activities);
  const updatedRooms = enrichRoomsWithStats(rooms, activities);
  const socialLinks = hotels.reduce<string[]>((acc, hotel) => {
    const uniqueLinks = hotel.socialLinks?.filter((link) => !acc.includes(link)) || [];
    return [...acc, ...uniqueLinks];
  }, []);
  const updatedSocialLinks = enrichSocialLinksWithStats(socialLinks, activities);

  const prevKeyMetrics = getKeyMetrics(prevActivities);
  const change = calculateChange(keyMetrics, prevKeyMetrics);

  const overTime = calculateStatsOverTime(pastActivities.length > 0 ? pastActivities : activities);

  const topRoom: any =
    updatedRooms.length > 0
      ? updatedRooms.reduce((max, current) => (current.views > (max.views || 0) ? current : max))
      : null;
  const topLink: any =
    updatedLinks.length > 0 ? updatedLinks.reduce((max, current) => (current.taps > (max.taps || 0) ? current : max)) : null;

  const updatedHotels = enrichHotelsWithStats(hotels, activities);

  return {
    keyMetrics,
    links: updatedLinks,
    rooms: updatedRooms,
    socialLinks: updatedSocialLinks,
    overTime,
    change,
    activities,
    topRoom,
    topLink,
    hotels: updatedHotels,
  };
};
