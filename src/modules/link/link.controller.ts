import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as linkService from './link.service';
import { pick } from '../utils';
import { IOptions } from '../paginate/paginate';
import { profileService } from '../profile';
import { Activity } from '../activity';
import { userService } from '../user';

const validateProfile = async (profileId: mongoose.Types.ObjectId) => {
  const profile = await profileService.getProfileById(profileId);
  if (!profile) throw new ApiError(httpStatus.BAD_REQUEST, 'Profile not found.');
  return profile;
};

const validateUser = async (userId: mongoose.Types.ObjectId) => {
  const user = await userService.getUserById(userId);
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found.');
  return user;
};

export const getLinks = catchAsync(async (req: Request, res: Response) => {
  const { profile, template } = pick(req.query, ['profile', 'template']);
  const userProfile = profile ? await profileService.getProfileById(profile) : undefined;
  const user = userProfile ? await validateUser(userProfile.user) : undefined;

  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const filter = {
    $or: [
      profile ? { profile } : null,
      template ? { template } : null,
      user?.template ? { template: user.template.id } : null,
    ].filter(Boolean),
  };

  const result = await linkService.queryLinks(filter, options);
  res.send(result);
});

export const getLink = catchAsync(async (req: Request, res: Response) => {
  const { linkId } = req.params;
  const link = await linkService.getLinkById(new mongoose.Types.ObjectId(linkId));
  if (!link) throw new ApiError(httpStatus.NOT_FOUND, 'Link not found');

  const { profile } = pick(req.query, ['profile']);
  if (profile) {
    const userProfile = await validateProfile(profile);
    if (userProfile) {
      await Activity.create({
        user: userProfile.user,
        action: 'tap',
        description: `${userProfile.name}'s ${link.title || link.platform.title || ''} was tapped`,
        details: { image: userProfile.image, name: userProfile.name, linkId: link.id },
      });
    }
  }

  res.send(link);
});

export const createLink = catchAsync(async (req: Request, res: Response) => {
  const link = await linkService.createLink(req.body, req.files);
  res.status(httpStatus.CREATED).send(link);
});

export const updateLink = catchAsync(async (req: Request, res: Response) => {
  const { linkId } = req.params;
  const link = await linkService.updateLinkById(new mongoose.Types.ObjectId(linkId), req.body, req.files);
  res.send(link);
});

export const deleteLink = catchAsync(async (req: Request, res: Response) => {
  const { linkId } = req.params;
  await linkService.deleteLinkById(new mongoose.Types.ObjectId(linkId));
  res.status(httpStatus.NO_CONTENT).send();
});

export const reorderLinks = catchAsync(async (req: Request, res: Response) => {
  const { profileId } = req.params;
  await linkService.reorderLinks(new mongoose.Types.ObjectId(profileId), req.body);
  res.status(httpStatus.NO_CONTENT).send();
});
