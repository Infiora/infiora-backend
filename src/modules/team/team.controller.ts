import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import config from '../../config/config';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as teamService from './team.service';
import { match, pick } from '../utils';
import { IOptions } from '../paginate/paginate';
import { User, userService } from '../user';
import { leadService } from '../lead';

export const getTeams = catchAsync(async (req: Request, res: Response) => {
  const filter = match(req.query, ['name']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await teamService.queryTeams(filter, options);
  res.send(result);
});

export const getTeam = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    const team = await teamService.getTeamById(new mongoose.Types.ObjectId(req.params['teamId']));
    if (!team) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
    }
    res.send(team);
  }
});

export const updateTeam = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    const team = await teamService.updateTeamById(new mongoose.Types.ObjectId(req.params['teamId']), req.body, req.files);
    res.send(team);
  }
});

export const addMembers = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    await teamService.addMembers(new mongoose.Types.ObjectId(req.params['teamId']), req.body);
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const joinTeam = catchAsync(async (req: Request, res: Response) => {
  const token = await teamService.joinTeam(`${req.query['token']}`);
  if (token) {
    res.redirect(`${config.clientUrl}/set-password?token=${token}`);
  } else {
    res.redirect(config.dashUrl);
  }
});

export const leaveTeam = catchAsync(async (req: Request, res: Response) => {
  await teamService.removeMember(req.user.team, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export const getTeamMembers = catchAsync(async (req: Request, res: Response) => {
  const filter = match(req.query, ['email']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  filter.team = req.params['teamId'];
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

export const getTeamLeads = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    const filter = pick(req.query, ['user']);
    const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
    const users = await User.find({ team: new mongoose.Types.ObjectId(req.params['teamId']) });
    const userIds = users.map((u: any) => u._id.toString());
    const result = await leadService.queryLeads(
      { ...filter, user: { $in: userIds } },
      {
        ...options,
        populate: 'profile.direct.platform,user.live.direct.platform,user.team.profile.direct.platform',
      }
    );
    res.send(result);
  }
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    await teamService.removeMember(new mongoose.Types.ObjectId(req.params['teamId']), req.body.user);
    const result = await userService.queryUsers({ team: req.params['teamId'] }, {});
    res.send(result);
  }
});

export const deleteMember = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    const team = await teamService.getTeamById(new mongoose.Types.ObjectId(req.params['teamId']));
    if (String(team?.superAdmin) === String(req.body.user)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    await userService.deleteUserById(new mongoose.Types.ObjectId(req.body.user));
    const result = await userService.queryUsers({ team: req.params['teamId'] }, {});
    res.send(result);
  }
});

export const updateMember = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    await userService.updateUserById(new mongoose.Types.ObjectId(req.body.user), req.body);
    const result = await userService.queryUsers({ team: req.params['teamId'] }, {});
    res.send(result);
  }
});

export const duplicateMember = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    await userService.duplicateUser(new mongoose.Types.ObjectId(req.body.user));
    const result = await userService.queryUsers({ team: req.params['teamId'] }, {});
    res.send(result);
  }
});

export const cancelPlan = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['teamId'] === 'string') {
    await teamService.cancelPlan(new mongoose.Types.ObjectId(req.params['teamId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});
