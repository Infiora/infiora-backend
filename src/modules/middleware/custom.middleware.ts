import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { Hotel } from '../hotel';
import Tag from '../tag/tag.model';
import { Room } from '../room';

const isAdmin = (reqUser: any): boolean => {
  return reqUser.role === 'admin';
};

const isSelf = (reqUser: any, userId?: any): boolean => {
  return String(reqUser.id) === String(userId);
};

const validateOwnership = async (reqUser: any, user: any): Promise<void> => {
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, '');
  }

  if (!isAdmin(reqUser) && !isSelf(reqUser, user.id)) {
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
    const tag = await Tag.findById(req.params['tagId']).populate('user');
    if (!isAdmin(req.user)) await validateOwnership(req.user, tag?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isHotelOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const hotel = await Hotel.findById(req.params['hotelId']).populate('user');

    await validateOwnership(req.user, hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const isRoomOwner = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const room: any = await Room.findById(req.params['roomId']).populate('hotel.user');

    await validateOwnership(req.user, room?.hotel?.user);
    return next();
  } catch (error) {
    return next(error);
  }
};
