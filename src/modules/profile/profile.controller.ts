import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as profileService from './profile.service';
import match from '../utils/match';
import { getUserById } from '../user/user.service';
import { Lead } from '../lead';
import { removeNullFields } from '../utils';

export const createProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await profileService.createProfile({ ...req.body, user: req.user.id }, req.files);
  res.status(httpStatus.CREATED).send(profile);
});

export const getProfiles = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['user']), ...match(req.query, ['name']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await profileService.queryProfiles(filter, options);
  res.send(result);
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    const profile = await profileService.getProfile(req.params['profileId'], req.user?.id);
    if (!profile) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
    }

    const user = await getUserById(new mongoose.Types.ObjectId(String(profile.user)));
    const languageCode = user?.languageCode;
    const isConnected = req.user ? !!(await Lead.findOne({ user: req.user.id, profile: profile?.id })) : false;
    const template = removeNullFields(user?.toJSON()['template']);

    res.send({
      ...profile.toJSON(),
      ...template,
      id: profile.id,
      isConnected,
      languageCode,
    });
  }
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    const profile = await profileService.updateProfileById(
      new mongoose.Types.ObjectId(req.params['profileId']),
      req.body,
      req.files
    );
    res.send(profile);
  }
});

export const deleteProfile = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    await profileService.deleteProfileById(new mongoose.Types.ObjectId(req.params['profileId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const getMyProfiles = catchAsync(async (req: Request, res: Response) => {
  const filter = match(req.query, ['name']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  filter.user = req.user.id;
  const result = await profileService.queryProfiles(filter, options);
  res.send(result);
});

export const getContactCard = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    const contactCard = await profileService.exportContactCard(new mongoose.Types.ObjectId(req.params['profileId']));
    res.set('Content-Type', `text/vcard; name="contact_card.vcf"`);
    res.set('Content-Disposition', `inline; filename="contact_card.vcf"`);
    res.send(contactCard);
  }
});

export const getPkPass = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    const pass = await profileService.exportPkPass(new mongoose.Types.ObjectId(req.params['profileId']));

    res.type('application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="profile.pkpass"`);
    res.send(pass);
  }
});

export const duplicateProfile = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['profileId'] === 'string') {
    const profile = await profileService.duplicateProfile(new mongoose.Types.ObjectId(req.params['profileId']));

    res.status(httpStatus.CREATED).send(profile);
  }
});
