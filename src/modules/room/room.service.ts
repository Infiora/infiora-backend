import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Room from './room.model';
import ApiError from '../errors/ApiError';
import { NewCreatedRoom, UpdateRoomBody, IRoomDoc } from './room.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { uploadToS3 } from '../utils/awsS3Utils';

/**
 * Query for rooms
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryRooms = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const rooms = await Room.paginate(filter, options);
  return rooms;
};

/**
 * Get room by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IRoomDoc | null>}
 */
export const getRoomById = async (id: mongoose.Types.ObjectId): Promise<IRoomDoc | null> => Room.findById(id);

/**
 * Create a room
 * @param {NewCreatedRoom} roomBody
 * @param {Express.Multer.File[]} files
 * @returns {Promise<IRoomDoc>}
 */
export const createRoom = async (roomBody: NewCreatedRoom, files?: Express.Multer.File[]): Promise<IRoomDoc> => {
  const body = { ...roomBody };
  if (files && files.length > 0) {
    body.images = await Promise.all(files.map((file) => uploadToS3(file, 'room')));
  }
  return Room.create(body);
};

/**
 * Update room by id
 * @param {mongoose.Types.ObjectId} roomId
 * @param {UpdateRoomBody} updateBody
 * @param {Express.Multer.File[]} files
 * @returns {Promise<IRoomDoc | null>}
 */
export const updateRoomById = async (
  roomId: mongoose.Types.ObjectId,
  roomBody: UpdateRoomBody,
  files?: Express.Multer.File[]
): Promise<IRoomDoc | null> => {
  const body = { ...roomBody };
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  if (files && files.length > 0) {
    body.images = await Promise.all(files.map((file) => uploadToS3(file, 'room')));
  }
  Object.assign(room, body);
  await room.save();
  return room;
};

/**
 * Delete room by id
 * @param {mongoose.Types.ObjectId} roomId
 * @returns {Promise<IRoomDoc | null>}
 */
export const deleteRoomById = async (roomId: mongoose.Types.ObjectId): Promise<IRoomDoc | null> => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  await room.deleteOne();
  return room;
};
