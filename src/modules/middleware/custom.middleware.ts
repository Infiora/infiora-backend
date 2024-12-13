import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { Profile } from '../profile';
import { Link } from '../link';
import { Product } from '../product';
import { Lead } from '../lead';
import Tag from '../tag/tag.model';
import { Team } from '../team';
import { Template } from '../template';

const isAdminOrSelf = (reqUser: any, userId?: any): boolean => {
  return reqUser.role === 'admin' || String(reqUser.id) === String(userId);
};

const isTeamAccess = (reqUser: any, teamId?: any): boolean => {
  const { team } = reqUser;

  return (
    String(team.id) === String(teamId) &&
    (String(reqUser.id) === String(team.superAdmin) || team.admins.includes(reqUser.id))
  );
};

export const isOwner = (req: Request, _res: Response, next: NextFunction): void => {
  const { user } = req;

  if (isAdminOrSelf(user, req.params['userId']) || isAdminOrSelf(user, req.query['user'] as string)) {
    return next();
  }

  return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
};

const validateOwnership = async (reqUser: any, user: any): Promise<void> => {
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, '');
  }

  if (!isAdminOrSelf(reqUser, user.id) && !isTeamAccess(reqUser, user.team)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
};

export const isProfileOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await Profile.findById(req.params['profileId']).populate('user');
    const template = await Template.findById(req.params['profileId']).populate({
      path: 'team',
      populate: 'user',
    });
    await validateOwnership(req.user, profile?.user || template?.team?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isLinkOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const link: any = await Link.findById(req.params['linkId']).populate([
      {
        path: 'profile',
        populate: 'user',
      },
      {
        path: 'template',
        populate: {
          path: 'team',
          populate: 'superAdmin',
        },
      },
    ]);

    await validateOwnership(req.user, link?.profile?.user || link?.template?.team?.superAdmin);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isProductOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const product: any = await Product.findById(req.params['productId']).populate([
      {
        path: 'profile',
        populate: 'user',
      },
      {
        path: 'template',
        populate: {
          path: 'team',
          populate: 'superAdmin',
        },
      },
    ]);
    await validateOwnership(req.user, product?.profile?.user || product?.template?.team?.superAdmin);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isLeadOwner = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findById(req.params['leadId']).populate('user');
    await validateOwnership(req.user, lead?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isTagOwner = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const tag = await Tag.findById(req.params['tagId']).populate('user');
    await validateOwnership(req.user, tag?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isTemplateOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await Template.findById(req.params['templateId']);

    if (!template) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    }

    if (!isTeamAccess(req.user, template.team)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export const isTeamAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const team = await Team.findById(req.params['teamId']);

    if (!team) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
    }

    if (
      req.user.role === 'admin' ||
      (req.user.team &&
        String(req.user.team.id) === String(team.id) &&
        (String(req.user.id) === String(team.superAdmin) || team.admins.includes(req.user.id)))
    ) {
      return next();
    }

    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  } catch (error) {
    return next(error);
  }
};

export const isTeamOwner = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const team = await Team.findById(req.params['teamId']);
    if (!team) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
    }

    if (req.user.role === 'admin' || String(req.user.id) === String(team.superAdmin)) {
      return next();
    }

    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  } catch (error) {
    return next(error);
  }
};

export const isTeamMember = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const team = await Team.findById(req.params['teamId']);
    if (!team) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Team not found');
    }
    if (req.user.role === 'admin' || String(req.user.team.id) === String(team.id)) {
      return next();
    }

    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  } catch (error) {
    return next(error);
  }
};
