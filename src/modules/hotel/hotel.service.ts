import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Hotel from './hotel.model';
import ApiError from '../errors/ApiError';
import { NewCreatedHotel, UpdateHotelBody, IHotelDoc } from './hotel.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { uploadToS3 } from '../utils/awsS3Utils';

/**
 * Query for hotels
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryHotels = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const hotels = await Hotel.paginate(filter, options);
  return hotels;
};

/**
 * Get hotel by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IHotelDoc | null>}
 */
export const getHotelById = async (id: mongoose.Types.ObjectId): Promise<IHotelDoc | null> => Hotel.findById(id);

/**
 * Create a hotel
 * @param {NewCreatedHotel} hotelBody
 * @param {Express.Multer.File | undefined} file
 * @returns {Promise<IHotelDoc>}
 */
export const createHotel = async (hotelBody: NewCreatedHotel, files?: any): Promise<IHotelDoc> => {
  const body: any = { ...hotelBody };
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) body[field] = await uploadToS3(files[field][0], 'hotel');
      })
    );
  }
  return Hotel.create(body);
};

/**
 * Update hotel by id
 * @param {mongoose.Types.ObjectId} hotelId
 * @param {UpdateHotelBody} hotelBody
 * @param {Express.Multer.File | undefined} file
 * @returns {Promise<IHotelDoc | null>}
 */
export const updateHotelById = async (
  hotelId: mongoose.Types.ObjectId,
  hotelBody: UpdateHotelBody,
  files?: any
): Promise<IHotelDoc | null> => {
  const body: any = { ...hotelBody };
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  if (files) {
    await Promise.all(
      Object.keys(files).map(async (field) => {
        if (files[field]) body[field] = await uploadToS3(files[field][0], 'hotel');
      })
    );
  }
  Object.assign(hotel, body);
  await hotel.save();
  return hotel;
};

/**
 * Delete hotel by id
 * @param {mongoose.Types.ObjectId} hotelId
 * @returns {Promise<IHotelDoc | null>}
 */
export const deleteHotelById = async (hotelId: mongoose.Types.ObjectId): Promise<IHotelDoc | null> => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  await hotel.deleteOne();
  return hotel;
};
