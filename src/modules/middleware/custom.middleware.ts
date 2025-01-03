import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { Hotel } from '../hotel';
import Tag from '../tag/tag.model';
import { Room } from '../room';
import { Link } from '../link';
import { Group } from '../group';

const isAdmin = (reqUser: any): boolean => {
  return reqUser.role === 'admin';
};

const isSelf = (reqUser: any, userId?: any): boolean => {
  return String(reqUser.id) === String(userId);
};

const validateOwnership = async (reqUser: any, userId: string): Promise<void> => {
  if (!userId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!isAdmin(reqUser) && !isSelf(reqUser, userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
};

// eslint-disable-next-line import/prefer-default-export
export const isOwner = (req: Request, _res: Response, next: NextFunction): void => {
  const { user } = req;

  if (isAdmin(user) || isSelf(user, req.params['userId']) || isSelf(user, req.query['user'] as string)) {
    return next();
  }

  return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
};

export const isTagOwner = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const tag: any = await Tag.findById(req.params['tagId']);
    if (!isAdmin(req.user)) await validateOwnership(req.user, tag?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isHotelOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const hotel: any = await Hotel.findById(req.params['hotelId']);

    await validateOwnership(req.user, hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isRoomOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const room: any = await Room.findById(req.params['roomId']).populate('hotel');
    await validateOwnership(req.user, room?.hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isRoomOrGroupOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const room: any = await Room.findById(req.params['id']).populate('hotel');
    const group: any = await Room.findById(req.params['id']).populate('hotel');
    await validateOwnership(req.user, room?.hotel?.user || group?.hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isLinkOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const link: any = await Link.findById(req.params['linkId']).populate([
      {
        path: 'room',
        populate: 'hotel',
      },
      {
        path: 'group',
        populate: 'hotel',
      },
    ]);

    await validateOwnership(req.user, link?.room?.hotel?.user || link?.group?.hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isGroupOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const group: any = await Group.findById(req.params['groupId']).populate('hotel');
    await validateOwnership(req.user, group?.hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};
