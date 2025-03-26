import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Room from './room.model';
import ApiError from '../errors/ApiError';
import { NewCreatedRoom, UpdateRoomBody, IRoomDoc, roomPopulate } from './room.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { removeNullFields, toPopulateString } from '../utils/miscUtils';
import Link from '../link/link.model';
import { reorderItems } from '../utils/arrayUtils';

/**
 * Query for rooms
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryRooms = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const rooms = await Room.paginate(filter, { ...options, populate: toPopulateString(roomPopulate) });
  return rooms;
};

/**
 * Get room by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IRoomDoc | null>}
 */
export const getRoomById = async (id: mongoose.Types.ObjectId): Promise<IRoomDoc | null> =>
  Room.findById(id).populate(roomPopulate);

/**
 * Get room
 * @param {mongoose.Types.ObjectId} id
 * @param {string | undefined} action
 * @returns {Promise<any>}
 */
export const getRoom = async (id: mongoose.Types.ObjectId): Promise<any> => {
  const room = await getRoomById(id);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  const links = await Link.find({
    $or: [{ room }, room.group && { group: room.group.id }].filter(Boolean),
  });
  const json: any = room.toJSON();
  return { ...json, ...removeNullFields(json.group), id: json.id, links: reorderItems(links.filter((l) => l.isActive)) };
};

/**
 * Create a room
 * @param {NewCreatedRoom} roomBody
 * @returns {Promise<IRoomDoc>}
 */
export const createRoom = async (roomBody: NewCreatedRoom): Promise<IRoomDoc> => {
  const { quantity, ...room } = roomBody;
  const roomCount = await Room.countDocuments({ hotel: room.hotel });

  const createdRooms = await Promise.all(
    Array.from({ length: quantity }, async (_, index) => {
      const newRoom = { ...room, number: roomCount + quantity - index };
      return Room.create(newRoom).then((r) => r.populate(roomPopulate));
    })
  );

  return createdRooms[0]!;
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
  roomBody: UpdateRoomBody
): Promise<IRoomDoc | null> => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  Object.assign(room, roomBody);
  await room.save().then((t) => t.populate(roomPopulate));
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
