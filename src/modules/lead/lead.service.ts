import httpStatus from 'http-status';
import vCardsJS from 'vcards-js2';
import mongoose from 'mongoose';
import { json2csv } from 'json-2-csv';
import Lead from './lead.model';
import ApiError from '../errors/ApiError';
import { NewCreatedLead, UpdateLeadBody, ILeadDoc, leadPopulate } from './lead.interfaces';
import { getFile, uploadFile } from '../utils';
import { IOptions, QueryResult } from '../paginate/paginate';
import User from '../user/user.model';
import Profile from '../profile/profile.model';
import { notificationService } from '../notification';
import { Activity } from '../activity';
import { integrationService } from '../integration';

/**
 * Generate data from a lead.
 * @param lead - The lead object.
 * @returns {Record<string, any>}
 */
const generateData = (lead: ILeadDoc): Record<string, any> => {
  return {
    ...(lead.profile
      ? {
          Name: lead.profile.name || '',
          'Job Title': lead.profile.jobTitle || '',
          Company: lead.profile.company || '',
          Note: lead.profile.bio || '',
        }
      : Object.keys(lead.data ?? {}).reduce((acc: Record<string, any>, key: string) => {
          acc[lead.data[key].label || key] = lead.data[key].value || '';
          return acc;
        }, {} as Record<string, any>)),
    'Lead Owner': lead.user.live?.name || '',
    'Lead Owner Email': lead.user.email || '',
  };
};

/**
 * Create a lead
 * @param {NewCreatedLead} leadBody
 * @param {any} user
 * @param {any} profile
 * @returns {Promise<ILeadDoc>}
 */
export const createLead = async (leadBody: NewCreatedLead, user: any, profile: any): Promise<ILeadDoc> => {
  const body = { ...leadBody, user: user.id };

  if (profile) {
    body.profile = profile.id;
    await User.findByIdAndUpdate(user.id, { $push: { leads: profile.id } });
    await notificationService.sendNotification(
      [profile.user.fcmToken],
      `${user.live.name} added you`,
      'Tap here to see the new connection'
    );
  }
  const lead = await Lead.create(body).then((t) => t.populate(leadPopulate));
  const data: any = generateData(lead);

  await Activity.create({
    user: lead.user,
    action: 'connect',
    description: `${data.Name} connected with ${user.live.name || ''}`,
    details: { image: body?.image || profile?.image, name: data.Name, type: leadBody.type },
  });

  await integrationService.syncLead(user.integrations, [data]);
  return lead;
};

/**
 * Create a lead
 * @param {NewCreatedLead} leadBody
 * @param {any} files
 * @returns {Promise<ILeadDoc | null>}
 */
export const addLead = async (leadBody: NewCreatedLead, files: any): Promise<ILeadDoc | null> => {
  const { user, profile } = leadBody;

  const currentUser: any = await User.findById(user).populate('live');
  const otherProfile: any = await Profile.findById(profile).populate('user');

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (profile && !otherProfile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  const existingLead = await Lead.findOne({ user, profile });

  if (existingLead && profile) {
    await existingLead.deleteOne();
    await User.findByIdAndUpdate(user, { $pull: { leads: profile } });

    return null;
  }

  // Create a new lead.
  const body: any = { ...leadBody };

  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) {
          body[field] = await uploadFile(files[field][0], 'lead');
        }
      })
    );
  }
  const lead = await createLead(body, currentUser, otherProfile);

  if (otherProfile) {
    const otherUser: any = await User.findById(otherProfile.user.id).populate('live');
    const currentProfile: any = await Profile.findById(currentUser.live.id).populate('user');

    // Check if the other user has lead capture mode on.
    if (otherProfile.isLeadCapture) {
      const existingReverseLead = await Lead.findOne({ user: otherUser.id, profile: currentProfile.id });

      if (!existingReverseLead) {
        // Create a reverse lead if it doesn't already exist.
        await createLead(leadBody, otherUser, currentProfile);
      }
    }
  }

  return Lead.findById(lead.id).populate(leadPopulate);
};

/**
 * Query for leads
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryLeads = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const leads = await Lead.paginate(filter, { ...options, populate: 'profile.direct.platform,user.live.direct.platform' });
  return leads;
};

/**
 * Get lead by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ILeadDoc | null>}
 */
export const getLeadById = async (id: mongoose.Types.ObjectId): Promise<ILeadDoc | null> =>
  Lead.findById(id).populate(leadPopulate);

/**
 * Update lead by id
 * @param {mongoose.Types.ObjectId} leadId
 * @param {UpdateLeadBody} updateBody
 * @param {any} files
 * @returns {Promise<ILeadDoc | null>}
 */
export const updateLeadById = async (
  leadId: mongoose.Types.ObjectId,
  updateBody: UpdateLeadBody,
  files: any
): Promise<ILeadDoc | null> => {
  const body = updateBody;
  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
  }

  if (files) {
    const { cover, image, logo } = files;
    if (image) {
      body.image = await uploadFile(image[0], 'profile');
    }
    if (cover) {
      body.cover = await uploadFile(cover[0], 'profile');
    }
    if (logo) {
      body.logo = await uploadFile(logo[0], 'profile');
    }
  }

  Object.assign(lead, body);
  await lead.save().then((t) => t.populate(leadPopulate));
  return lead;
};

/**
 * Delete lead by id
 * @param {mongoose.Types.ObjectId} leadId
 * @returns {Promise<LeadType | null>}
 */
export const deleteLeadById = async (leadId: mongoose.Types.ObjectId): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
  }
  await lead.deleteOne();
  return lead;
};

/**
 * Export contact card
 * @returns {Promise<any>}
 */
export const exportContactCard = async (leadId: mongoose.Types.ObjectId): Promise<any> => {
  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
  }
  const vCard = vCardsJS();

  if (lead.image && lead.image !== '') {
    const urlObj = new URL(lead.image);
    const key = urlObj.pathname.substring(1);
    if (key) {
      const image = await getFile(key);
      if (image && image.Body) {
        vCard.photo.embedFromString(image.Body.toString('base64'), 'image/png');
      }
    }
  }
  const data: any = generateData(lead);
  vCard.firstName = data.Name;
  vCard.email = data.Email;
  vCard.cellPhone = data.Phone;
  vCard.organization = data.Company;
  vCard.title = data.JobTitle;
  vCard.note = data.Notes;

  return vCard.getFormattedString();
};

/**
 * Export a single lead.
 * @param {mongoose.Types.ObjectId} leadId - The ID of the lead to export.
 * @param {string} key - The export key (e.g., 'csv', 'monday').
 * @returns {Promise<string | void>} - CSV string or void.
 */
export const exportLead = async (leadId: mongoose.Types.ObjectId, key: string): Promise<string | void> => {
  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
  }
  const data = generateData(lead);

  if (key === 'csv') {
    return json2csv([data]);
  }
  const integrations = lead.user.integrations?.filter((i) => i.key === key) || [];
  await integrationService.syncLead(integrations, [data], false);
};

/**
 * Export multiple leads.
 * @param {mongoose.Types.ObjectId} userId - The ID of the user whose leads are being exported.
 * @param {string} key - The export key (e.g., 'csv', 'monday').
 * @returns {Promise<string | void>} - CSV string or void.
 */
export const exportLeads = async (leads: any, key: string): Promise<string | void> => {
  const data = leads.map((lead: ILeadDoc) => generateData(lead));

  if (key === 'csv') {
    return json2csv(data);
  }
  const integrations = leads[0]?.user.integrations?.filter((i: any) => i.key === key) || [];
  await integrationService.syncLead(integrations, data, false);
};
