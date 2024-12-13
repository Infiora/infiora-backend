import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as userService from './user.service';
import match from '../utils/match';
import { revenuecatService } from '../revenuecat';
import { Activity } from '../activity';
import Link from '../link/link.model';
import Tag from '../tag/tag.model';
import { stripeService } from '../stripe';
import * as teamService from '../team/team.service';
import { leadService } from '../lead';
import { toDate } from '../utils';
import User from './user.model';

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  let isPro = user?.subscription !== '';
  let isPaid;

  const subscriber = await revenuecatService.getSubscriberById(user);
  if (subscriber) {
    isPro = !!subscriber?.entitlements?.pro || isPro;
  }
  if (user.team && user.stripeSubscription) {
    isPaid = await stripeService.checkInvoices(user.stripeSubscription);
    isPro = true;
  }

  res.send({ ...user?.toJSON(), isPro, isPaid });
});

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['role']), ...match(req.query, ['email']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(req.params['userId']));
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send(user);
  }
});

export const updateUserById = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const user = await userService.updateUserById(new mongoose.Types.ObjectId(req.params['userId']), req.body);
    res.send(user);
  }
});

export const deleteUserById = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    await userService.deleteUserById(new mongoose.Types.ObjectId(req.params['userId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserById(new mongoose.Types.ObjectId(req.user.id), req.body);
  res.send(user);
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteUserById(req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export const exportUsers = catchAsync(async (_req: Request, res: Response) => {
  const csv = await userService.exportUsers();
  res.set('Content-Type', `text/csv; name="users.csv"`);
  res.set('Content-Disposition', `inline; filename="users.csv"`);
  res.send(csv);
});

export const exportLeads = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const csv = await leadService.exportLeads(new mongoose.Types.ObjectId(req.params['userId']), 'csv');
    res.set('Content-Type', `text/csv; name="leads.csv"`);
    res.set('Content-Disposition', `inline; filename="leads.csv"`);
    res.send(csv);
  }
});

export const getInsights = catchAsync(async (req: Request, res: Response) => {
  const dates = pick(req.query, ['startDate', 'endDate']);

  // Fetch user data
  const user: any = await userService.getUserById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { start, end } = toDate(dates);

  let userIds = [user.id];
  let profileIds = [user.live.id];
  if (user.team) {
    const { team } = user;
    if (team && (String(user.id) === String(team.superAdmin) || team.admins.includes(user.id))) {
      const teamUsers = await User.find({ team: team.id });
      userIds = teamUsers.map((u) => u.id);
      profileIds = teamUsers.map((u) => u.live);
    }
  }

  // Fetch links and activities
  const [links, tags, activities] = await Promise.all([
    Link.find({ profile: { $in: profileIds } }).populate([{ path: 'platform' }, { path: 'profile' }]),
    Tag.find({ user: { $in: userIds } }),
    Activity.find({ user: { $in: userIds }, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
  ]);

  // Initialize stats object
  const stats: Record<string, Record<string, number>> = {
    connect: {},
    tap: {},
    view: {},
    download: {},
  };

  // Populate stats with activity counts by date
  activities.forEach(({ action, createdAt }) => {
    const date = new Date(createdAt).toISOString().split('T')[0];
    if (date && stats[action]) {
      stats[action]![date] = (stats[action]![date] || 0) + 1;
    }
  });

  // Map links with tap counts
  const data = links.map((link) => ({
    ...link.toJSON(),
    taps: activities.reduce((sum, activity) => {
      return activity.action === 'tap' && activity.details.linkId === link.id ? sum + 1 : sum;
    }, 0),
  }));

  // Calculate accessory counts
  const data1 = tags.map((tag) => ({
    ...tag.toJSON(),
    views: activities.reduce((sum, activity) => {
      return activity.details?.type === 'Accessory' && activity.details.tagId === tag.id ? sum + 1 : sum;
    }, 0),
  }));

  res.send({
    activities,
    stats,
    links: data,
    accessories: data1,
  });
});

export const getPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const paymentMethod = await stripeService.getPaymentMethod(req.user.stripeCustomer);
  res.send(paymentMethod);
});

export const createPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const paymentMethod = await stripeService.createPaymentMethod(req.user.stripeCustomer, req.body);
  res.send(paymentMethod);
});

export const updatePaymentMethod = catchAsync(async (req: Request, res: Response) => {
  let paymentMethod = await stripeService.getPaymentMethod(req.user.stripeCustomer);
  if (!paymentMethod) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
  }
  paymentMethod = await stripeService.updatePaymentMethod(paymentMethod.id, req.body);
  res.send(paymentMethod);
});

export const getPrices = catchAsync(async (_req: Request, res: Response) => {
  const prices = await stripeService.getPrices();
  res.send(prices);
});

export const subscribe = catchAsync(async (req: Request, res: Response) => {
  const subscription = await stripeService.createSubscription(req.user.stripeCustomer, {
    ...req.body,
    isFreeAccess: req.user.subscription === 'team' || req.user.subscription === 'premium',
  });
  const team = await teamService.createTeam({
    superAdmin: req.user.id,
    stripeSubscription: subscription.id,
    stripeCustomer: req.user.stripeCustomer,
    totalMembers: 1,
  });
  const user = await userService.updateUserById(req.user.id, { stripeSubscription: subscription.id, team: team.id });
  res.send(user);
});

export const getInvoices = catchAsync(async (req: Request, res: Response) => {
  const paymentMethod = await stripeService.getInvoices(req.user.stripeCustomer);
  res.send(paymentMethod);
});

export const addIntegration = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.addIntegration(new mongoose.Types.ObjectId(req.user.id), req.body);

  res.status(200).json(user);
});

export const removeIntegration = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.removeIntegration(new mongoose.Types.ObjectId(req.user.id), req.body);

  res.status(200).json(user);
});
