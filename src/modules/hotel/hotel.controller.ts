import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import * as hotelService from './hotel.service';
import { pick, match } from '../utils';
import { IOptions } from '../paginate/paginate';
import { toObjectId } from '../utils/mongoUtils';

export const getHotels = catchAsync(async (req: Request, res: Response) => {
  const filter = { ...pick(req.query, ['user']), ...match(req.query, ['name']) };
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await hotelService.queryHotels(filter, options);
  res.send(result);
});

export const getHotel = catchAsync(async (req: Request, res: Response) => {
  const hotelId = toObjectId(req.params['hotelId']);
  const hotel = await hotelService.getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  res.send(hotel);
});

export const createHotel = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  const hotel = await hotelService.createHotel(req.body, file);
  res.status(httpStatus.CREATED).send(hotel);
});

export const updateHotel = catchAsync(async (req: Request, res: Response) => {
  const hotelId = toObjectId(req.params['hotelId']);
  const file = req.file as Express.Multer.File;
  const hotel = await hotelService.updateHotelById(hotelId, req.body, file);
  res.send(hotel);
});

export const deleteHotel = catchAsync(async (req: Request, res: Response) => {
  const hotelId = toObjectId(req.params['hotelId']);
  await hotelService.deleteHotelById(hotelId);
  res.status(httpStatus.NO_CONTENT).send();
});
