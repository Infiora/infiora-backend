import httpStatus from 'http-status';
import mongoose, { isValidObjectId } from 'mongoose';
import vCardsJS from 'vcards-js2';
import fs from 'fs';
import passkit from 'passkit-generator';
import ApiError from '../errors/ApiError';
import config from '../../config/config';
import Profile from './profile.model';
import Link from '../link/link.model';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedProfile, UpdateProfileBody, IProfileDoc } from './profile.interfaces';
import { getFile, toUrl, uploadFile } from '../utils';
import { IPlatform } from '../platform/platform.interfaces';
import * as userService from '../user/user.service';
import { tagService } from '../tag';
import { Activity } from '../activity';
import { IUserDoc } from '../user/user.interfaces';

const populate = [
  {
    path: 'direct',
    populate: {
      path: 'platform',
    },
  },
];

/**
 * Create a profile
 * @param {NewCreatedProfile} profileBody
 * @param {any} files
 * @returns {Promise<IProfileDoc>}
 */
export const createProfile = async (profileBody: NewCreatedProfile, files?: any): Promise<IProfileDoc> => {
  const body: any = { ...profileBody };
  const profiles = await Profile.find({ user: body.user });
  if (profiles.length > 9) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile limit exceeded');
  }
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) {
          body[field] = await uploadFile(files[field][0], 'profile');
        }
      })
    );
  }
  return Profile.create(profileBody).then((t) => t.populate(populate));
};

/**
 * Query for profiles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryProfiles = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const profiles = await Profile.paginate(filter, { ...options, populate: 'direct.platform' });
  return profiles;
};

/**
 * Get profile by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IProfileDoc | null>}
 */
export const getProfileById = async (id: mongoose.Types.ObjectId): Promise<IProfileDoc | null> =>
  Profile.findById(id).populate(populate);

/**
 * Get profile
 * @param {any} id
 * @param {any} reqUserId
 * @returns {Promise<IProfileDoc | null>}
 */
export const getProfile = async (id: any, reqUserId: any): Promise<IProfileDoc | null> => {
  let type = 'Share';
  let tag;
  let profile = isValidObjectId(id) ? await getProfileById(id) : null;

  if (!profile) {
    let user = await userService.getUser(id);
    if (!user) {
      tag = await tagService.getTag(id);
      if (tag && tag.user) {
        user = await userService.getUserById(new mongoose.Types.ObjectId(`${tag.user}`));
        type = 'Accessory';
      }
    }
    if (user && 'id' in user.live) {
      profile = await getProfileById(user.live.id);
    }
  }

  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  if (String(profile.user) !== String(reqUserId)) {
    await Activity.create({
      user: profile.user,
      action: 'view',
      description: `${profile.name}'s card was viewed`,
      details: { image: profile.image, name: profile.name, profileId: profile.id, type, tagId: tag?.id },
    });
    await profile.save().then((t) => t.populate(populate));
  }

  return profile;
};

/**
 * Update profile by id
 * @param {mongoose.Types.ObjectId} profileId
 * @param {UpdateProfileBody} updateBody
 * @param {any} files
 * @returns {Promise<IProfileDoc | null>}
 */
export const updateProfileById = async (
  profileId: mongoose.Types.ObjectId,
  updateBody: UpdateProfileBody,
  files?: any
): Promise<IProfileDoc | null> => {
  const body: any = { ...updateBody };
  const profile = await getProfileById(profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) {
          body[field] = await uploadFile(files[field][0], 'profile');
        }
      })
    );
  }
  Object.assign(profile, body);
  await profile.save().then((t) => t.populate(populate));
  return profile;
};

/**
 * Delete profile by id
 * @param {mongoose.Types.ObjectId} profileId
 */
export const deleteProfileById = async (profileId: mongoose.Types.ObjectId) => {
  const profile = await Profile.findById(profileId).populate<{ user: IUserDoc }>('user');

  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  // Check if the profile to be deleted is the current live profile
  if (String(profile.user.live) === String(profileId)) {
    const userProfiles = await Profile.find({ user: profile.user.id });

    if (userProfiles.length > 1) {
      const newLiveProfile = userProfiles.find((p) => String(p.id) !== String(profileId));

      if (newLiveProfile) {
        await userService.updateUserById(profile.user.id, { live: newLiveProfile.id });
      }
    }
  }

  await profile.deleteOne();
};

/**
 * Export contact card
 * @returns {Promise<any>}
 */
export const exportContactCard = async (profileId: mongoose.Types.ObjectId): Promise<any> => {
  const profile = await getProfileById(profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  const vCard = vCardsJS();
  vCard.firstName = profile.name || '';
  vCard.note = profile.bio || '';

  if (profile.image && profile.image !== '') {
    const urlObj = new URL(profile.image);
    const key = urlObj.pathname.substring(1);
    if (key) {
      const image = await getFile(key);
      if (image && image.Body) {
        vCard.photo.embedFromString(image.Body.toString('base64'), 'image/png');
      }
    }
  }

  const links = await Link.find({ profile: profile.id }).populate<{ platform: IPlatform }>('platform');

  const contactCard = links.find((link) => link.platform.type === 'contact');

  const filteredLinks = links.filter((link) => (contactCard ? link.isContact : link.isActive));

  if (contactCard && contactCard.data && contactCard.data !== '' && contactCard.isActive) {
    const data = JSON.parse(contactCard.data);
    vCard.firstName = data.firstName;
    vCard.lastName = data.lastName;
    vCard.organization = data.company;
    vCard.workEmail = data.email;
    vCard.cellPhone = data.mobile;
    vCard.homePhone = data.homePhone;
    vCard.workPhone = data.workPhone;
    vCard.title = data.jobTitle;
    vCard.url = data.website;
    vCard.homeAddress.label = 'Address';
    vCard.homeAddress.street = data.address;
  }

  vCard.socialUrls[config.appName] = `${config.clientUrl}/${profile.id}`;

  vCard.email = filteredLinks.filter((l) => l.platform.type === 'email').map((l) => l.value);
  vCard.cellPhone = filteredLinks.filter((l) => l.platform.type === 'phone' && l.isActive).map((l) => l.value);

  filteredLinks.forEach((link) => {
    if (link.platform.type !== 'contact' && link.platform.type !== 'email' && link.platform.type !== 'phone') {
      let url = `${link.platform.webBaseURL}${link.value}`;
      if (link.platform.type === 'url') {
        url = toUrl(url);
      } else if (link.platform.type === 'file') {
        url = `${link.platform.webBaseURL}${link.file}`;
      }
      vCard.socialUrls[link.title || link.platform.title] = url;
    }
  });

  await Activity.create({
    user: profile.user,
    action: 'download',
    description: `${profile.name}'s contact was downloaded`,
    details: { image: profile.image, name: profile.name, profileId: profile.id },
  });

  return vCard.getFormattedString();
};

/**
 * Export pkpass
 * @returns {Promise<any>}
 */
export const exportPkPass = async (profileId: mongoose.Types.ObjectId): Promise<any> => {
  const profile = await getProfileById(profileId);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  const wwdr = fs.readFileSync('./src/keys/wwdr.pem', 'utf8');
  const signerCert = fs.readFileSync('./src/keys/signerCert.pem', 'utf8');
  const signerKey = fs.readFileSync('./src/keys/signerKey.pem', 'utf8');

  let image;
  if (profile.image && profile.image !== '') {
    const urlObj = new URL(profile.image);
    const key = urlObj.pathname.substring(1);
    if (key) {
      image = await getFile(key);
    }
  }

  const response = await fetch(`${config.clientUrl}/logo.png`);
  const logo = await response.arrayBuffer();

  const pass = new passkit.PKPass(
    {
      'icon.png': Buffer.from(logo),
      'logo.png': Buffer.from(logo),
      'thumbnail.png': image?.Body,
      'pass.json': Buffer.from(
        JSON.stringify({
          formatVersion: 1,
          passTypeIdentifier: 'pass.com.xertk.infiora',
          teamIdentifier: '4Y87W2JLBF',
          organizationName: config.appName,
          description: 'Business Card',
          foregroundColor: 'rgb(0, 0, 0)',
          backgroundColor: 'rgb(255, 255, 255)',
          generic: {
            primaryFields: [
              {
                key: 'name',
                value: profile.name || '',
              },
            ],
            secondaryFields: [
              {
                key: 'jobTitle',
                value: profile.jobTitle || '',
              },
            ],
            auxiliaryFields: [
              {
                key: 'company',
                value: profile.company || '',
              },
            ],
            headerFields: [
              {
                key: 'title',
                value: profile.title || '',
              },
            ],
          },
        })
      ),
    },
    {
      wwdr,
      signerCert,
      signerKey,
      signerKeyPassphrase: '8852',
    },
    {
      serialNumber: profile.id,
    }
  );
  pass.setBarcodes(`${config.clientUrl}/${profile.id}`);

  return pass.getAsBuffer();
};

/**
 * Duplicate profile by id
 * @param {mongoose.Types.ObjectId} profileId
 */
export const duplicateProfile = async (profileId: mongoose.Types.ObjectId) => {
  const profile = await Profile.findById(profileId).select('-createdAt -updatedAt');
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  const profiles = await Profile.find({ user: profile.user });
  if (profiles.length > 9) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile limit exceeded');
  }

  const profileData = profile.toObject();
  delete profileData._id;
  delete profileData.isDirect;
  delete profileData.direct;
  const newProfile = await Profile.create(profileData);

  // Find and duplicate all links associated with the original profile
  const links = await Link.find({ profile: profileId });
  const newLinks = links.map((link) => {
    const linkData = link.toObject();
    delete linkData._id;
    linkData.profile = newProfile._id; // Associate with the new profile
    return linkData;
  });

  // Insert the duplicated links into the database
  await Link.insertMany(newLinks);

  // Populate the new profile with related fields
  return newProfile.populate(populate);
};
