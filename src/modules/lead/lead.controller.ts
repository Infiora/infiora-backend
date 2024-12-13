import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as leadService from './lead.service';
import * as ocrService from './ocr.service';
import { match, pick, toDate } from '../utils';
import { IOptions } from '../paginate/paginate';
import User from '../user/user.model';

export const getLeads = catchAsync(async (req: Request, res: Response) => {
  const query = pick(req.query, ['user', 'startDate', 'endDate']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const { start, end } = toDate(query);
  const filter = {
    user: query.user,
    createdAt: { $gte: start, $lte: end },
    ...match(req.query, ['data.name.value']),
  };

  let userIds;
  if (filter.user) {
    const user = await User.findById(filter.user).populate('team');
    if (user && user.team) {
      if (String(user.team.superAdmin) === String(user.id) || user.team.admins.includes(user.id)) {
        const teamUsers = await User.find({ team: user.team.id });
        userIds = teamUsers.map((u) => u.id);
        filter.user = { $in: userIds };
      }
    }
  }

  const result = await leadService.queryLeads(filter, options);
  res.send(result);
});

export const getLead = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['leadId'] === 'string') {
    const lead = await leadService.getLeadById(new mongoose.Types.ObjectId(req.params['leadId']));
    if (!lead) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
    }
    res.send(lead);
  }
});

export const createLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.addLead(req.body, req.files);
  res.json(lead);
});

export const updateLead = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['leadId'] === 'string') {
    const lead = await leadService.updateLeadById(new mongoose.Types.ObjectId(req.params['leadId']), req.body, req.files);
    res.send(lead);
  }
});

export const deleteLead = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['leadId'] === 'string') {
    await leadService.deleteLeadById(new mongoose.Types.ObjectId(req.params['leadId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const exportLead = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['leadId'] === 'string' && typeof req.query['key'] === 'string') {
    const lead = await leadService.exportLead(new mongoose.Types.ObjectId(req.params['leadId']), req.query['key']);
    if (req.query['key'] === 'csv') {
      res.set('Content-Type', `text/csv; name="leads.csv"`);
      res.set('Content-Disposition', `inline; filename="leads.csv"`);
      res.send(lead);
    } else {
      res.status(httpStatus.NO_CONTENT).send();
    }
  }
});

export const exportLeads = catchAsync(async (req: Request, res: Response) => {
  const query = pick(req.query, ['user', 'key', 'startDate', 'endDate']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const { start, end } = toDate(query);
  const filter = {
    user: query.user,
    createdAt: { $gte: start, $lte: end },
    ...match(req.query, ['data.name.value']),
  };

  let userIds;
  if (filter.user) {
    const user = await User.findById(filter.user).populate('team');
    if (user && user.team) {
      if (String(user.team.superAdmin) === String(user.id) || user.team.admins.includes(user.id)) {
        const teamUsers = await User.find({ team: user.team.id });
        userIds = teamUsers.map((u) => u.id);
        filter.user = { $in: userIds };
      }
    }
  }
  const result = await leadService.queryLeads(filter, options);
  const leads = await leadService.exportLeads(result.results, query.key);
  if (req.query['key'] === 'csv') {
    res.set('Content-Type', `text/csv; name="leads.csv"`);
    res.set('Content-Disposition', `inline; filename="leads.csv"`);
    res.send(leads?.replace(/undefined/g, ''));
  } else {
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const getContactCard = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['leadId'] === 'string') {
    const contactCard = await leadService.exportContactCard(new mongoose.Types.ObjectId(req.params['leadId']));
    res.set('Content-Type', `text/vcard; name="contact_card.vcf"`);
    res.set('Content-Disposition', `inline; filename="contact_card.vcf"`);
    res.send(contactCard);
  }
});

export const scanCard = catchAsync(async (req: Request, res: Response) => {
  const details = await ocrService.scanCard(req.file);
  res.send(details);
});
