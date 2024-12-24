import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Hotel from './hotel.model';
import ApiError from '../errors/ApiError';
import { NewCreatedHotel, UpdateHotelBody, IHotelDoc } from './hotel.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';

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
 * @returns {Promise<IHotelDoc>}
 */
export const createHotel = async (hotelBody: NewCreatedHotel): Promise<IHotelDoc> => {
  return Hotel.create(hotelBody);
};

/**
 * Update hotel by id
 * @param {mongoose.Types.ObjectId} hotelId
 * @param {UpdateHotelBody} updateBody
 * @returns {Promise<IHotelDoc | null>}
 */
export const updateHotelById = async (
  hotelId: mongoose.Types.ObjectId,
  updateBody: UpdateHotelBody
): Promise<IHotelDoc | null> => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }

  Object.assign(hotel, updateBody);
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
