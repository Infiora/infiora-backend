import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Team from './team.model';
import ApiError from '../errors/ApiError';
import { ITeamDoc, UpdateTeamBody } from './team.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import User from '../user/user.model';
import { emailService } from '../email';
import { tokenService } from '../token';
import { stripeService } from '../stripe';
import { generateString, uploadFile } from '../utils';
import * as userService from '../user/user.service';

/**
 * Create a team
 * @param {CreateTeamBody} teamBody
 * @returns {Promise<ITeamDoc>}
 */
export const createTeam = async (teamBody: any): Promise<ITeamDoc> => {
  return Team.create(teamBody);
};

/**
 * Query for teams
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryTeams = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const teams = await Team.paginate(filter, { ...options, populate: 'superAdmin' });
  return teams;
};

/**
 * Get team by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ITeamDoc | null>}
 */
export const getTeamById = async (id: mongoose.Types.ObjectId): Promise<ITeamDoc | null> => Team.findById(id);

/**
 * Update team by id
 * @param {mongoose.Types.ObjectId} teamId
 * @param {UpdateTeamBody} updateBody
 * @returns {Promise<ITeamDoc | null>}
 */
export const updateTeamById = async (
  teamId: mongoose.Types.ObjectId,
  updateBody: UpdateTeamBody,
  files: any
): Promise<ITeamDoc | null> => {
  const body: any = updateBody;
  const team = await getTeamById(teamId);
  if (!team) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
  }
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) {
          body[field] = await uploadFile(files[field][0], 'team');
        }
      })
    );
  }
  Object.assign(team, body);
  await team.save();
  return team;
};

const addMember = async (teamId: mongoose.Types.ObjectId, email: string) => {
  let isNew;
  let user = await userService.getUserByEmail(email);
  if (!user) {
    const password = generateString(8);
    user = await userService.createUser({ email, password });
    isNew = true;
  }
  if (user)
    await User.findByIdAndUpdate(user.id, {
      team: teamId,
    });

  return isNew;
};

/**
 * add members to the team
 * @param {mongoose.Types.ObjectId} teamId
 * @param {object} body
 */
export const addMembers = async (teamId: mongoose.Types.ObjectId, body: any) => {
  const team = await getTeamById(new mongoose.Types.ObjectId(teamId));
  if (!team) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
  }
  let updateTeam;
  await Promise.allSettled(
    body.emails.map(async (email: string) => {
      if (body.sendInvites) {
        const teamInviteToken = await tokenService.generateTeamInviteToken(`${teamId},${email}`);
        await emailService.sendTeamInviteEmail(email, teamInviteToken);
      } else {
        await addMember(team.id, email);
        updateTeam = true;
      }
    })
  );
  if (updateTeam) {
    const totalMembers = await User.countDocuments({ team: team.id });
    Object.assign(team, { totalMembers });
    await team.save();
    await stripeService.createUsageRecord(team.stripeSubscription, totalMembers);
  }
};

/**
 * Join team
 * @param {string} token
 * @returns {Promise<string | undefined>}
 */
export const joinTeam = async (token: string): Promise<string | undefined> => {
  let payload;
  try {
    payload = await tokenService.verifyTeamToken(token);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Link expired ask your admin to resend the invite.');
  }
  let resetPasswordToken;
  if (payload && typeof payload.sub === 'string') {
    const teamId = payload.sub.split(',')[0];
    const email = payload.sub.split(',')[1] || '';
    const team = await getTeamById(new mongoose.Types.ObjectId(teamId));
    if (!team) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
    }
    const isNew = await addMember(team.id, email);
    if (isNew) resetPasswordToken = await tokenService.generateResetPasswordToken(email);
    Object.assign(team, { totalMembers: team.totalMembers + 1 });
    await team.save();
    await stripeService.createUsageRecord(team.stripeSubscription, team.totalMembers);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid link, please check again!');
  }
  return resetPasswordToken;
};

/**
 * Remove member from team
 * @param {mongoose.Types.ObjectId} teamId
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<void>}
 */
export const removeMember = async (teamId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const team = await getTeamById(teamId);
  if (!team) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
  }
  await User.findByIdAndUpdate(user.id, { $unset: { team: 1 }, isLocked: false });
  Object.assign(team, { totalMember: team.totalMembers - 1 });
  await team.save();
  await stripeService.createUsageRecord(team.stripeSubscription, team.totalMembers);
};

/**
 * Cancel plan
 * @param {mongoose.Types.ObjectId} teamId
 */
export const cancelPlan = async (teamId: mongoose.Types.ObjectId) => {
  const team = await getTeamById(teamId);
  if (!team) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
  }
  await stripeService.cancelSubscription(team.stripeSubscription);
  await team.deleteOne();
};
