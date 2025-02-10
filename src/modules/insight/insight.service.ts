import { Activity } from '../activity';
import { IActivity } from '../activity/activity.interfaces';
import { Group } from '../group';
import { IHotelDoc } from '../hotel/hotel.interfaces';
import { Link } from '../link';
import { ILinkDoc } from '../link/link.interfaces';
import { Room } from '../room';
import { IRoomDoc } from '../room/room.interfaces';
import { toDate } from '../utils/miscUtils';

const getCounts = (activities: IActivity[], field: string): Record<string, number> | null => {
  const counts =
    activities.length > 0
      ? activities.reduce<Record<string, number>>((acc, activity) => {
          const key = activity.details[field] || 'Others';

          acc[key] = (acc[key] || 0) + 1;

          return acc;
        }, {})
      : {};
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
      stats.timeSpent[date] = (stats.timeSpent[date] || 0) + Number(details.time || 0);

      const visitorId = details.visitorId || '';

      if (!uniqueViewsTracker[date]) {
        uniqueViewsTracker[date] = new Set();
      }

      uniqueViewsTracker[date]!.add(visitorId);
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
  return rooms.map((room) => {
    const roomActivities = activities.filter((a) => a.details.room === room.id);
    const viewActivities = roomActivities.filter((a) => a.action === 'view');
    const tapActivities = roomActivities.filter((a) => a.action === 'tap');

    const uniqueViewers = new Set(viewActivities.map((a) => a.details.visitorId));
    const totalViews = viewActivities.length;
    const totalTaps = tapActivities.length;
    const returningViews = totalViews - uniqueViewers.size;
    const timeSpent =
      viewActivities.length > 0 ? viewActivities.reduce((sum, a) => sum + Number(a.details.time || 0), 0) : null;
    const bounces = viewActivities.filter((a) => !a.details.engaged).length;
    const bounceRate = (totalViews > 0 ? (bounces / totalViews) * 100 : 0).toFixed(0);

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
      ...room.toJSON(),
      views: totalViews,
      taps: totalTaps,
      topPerformingLink,
      topPerformingSocialLink,
      uniqueViews: uniqueViewers.size,
      returningViews,
      timeSpent,
      bounceRate,
      viewsByLanguages: getCounts(viewActivities, 'language'),
      viewsByDevices: getCounts(viewActivities, 'device'),
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
  const uniqueViews = new Set(viewActivities.map(({ details }) => details.visitorId || '')).size;
  const returningViews = views - uniqueViews;
  const timeSpent =
    updatedRooms.length > 0 ? viewActivities.reduce((sum, { details }) => sum + Number(details.time || 0), 0) : null;
  const bounceRate = (views > 0 ? ((views - engagedViews) / views) * 100 : 0).toFixed(0);
  const topRoom: any =
    updatedRooms.length > 0
      ? updatedRooms.reduce((max, current) => (current.views > (max.views || 0) ? current : max))
      : null;
  const topLink: any =
    updatedLinks.length > 0 ? updatedLinks.reduce((max, current) => (current.taps > (max.taps || 0) ? current : max)) : null;

  return {
    stats: {
      overTime,
      topPerforming: {
        room: topRoom?.id,
        link: topLink?.id,
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

export const getHotelInsights = async ({
  hotel,
  startDate,
  endDate,
}: {
  hotel: IHotelDoc;
  startDate: string;
  endDate: string;
}) => {
  const { start, end } = toDate({ startDate, endDate });

  // Fetch rooms and groups for the specified hotel
  const [rooms, groups] = await Promise.all([
    Room.find({ hotel: hotel.id }).populate('group'),
    Group.find({ hotel: hotel.id }),
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
      user: hotel.user,
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 }),
  ]);

  const stats = getStats({
    hotel,
    activities,
    links,
    rooms,
  });

  return { ...stats, activities };
};

export const getAdminInsights = async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
  const { start, end } = toDate({ startDate, endDate });

  return { start, end };
};
