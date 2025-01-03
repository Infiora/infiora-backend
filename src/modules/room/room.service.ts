import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Room from './room.model';
import ApiError from '../errors/ApiError';
import { NewCreatedRoom, UpdateRoomBody, IRoomDoc, roomPopulate } from './room.interfaces';
import { IOptions, QueryResult } from '../paginate/paginate';
import { uploadToS3 } from '../utils/awsS3Utils';
import { removeNullFields, toPopulateString } from '../utils/miscUtils';
import { tagService } from '../tag';
import { Activity } from '../activity';
import { Link } from '../link';
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
export const getRoom = async (id: mongoose.Types.ObjectId, action?: string): Promise<any> => {
  let updatedAction = action;
  let tag;
  let room = await getRoomById(id);

  if (!room) {
    tag = await tagService.getTagById(id);
    if (tag && tag.room) {
      room = await getRoomById(new mongoose.Types.ObjectId(`${tag.room}`));
      updatedAction = 'tap';
    }
  }

  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  if (updatedAction) {
    await Activity.create({
      user: room.hotel.user,
      action: updatedAction,
      details: {
        image: room.hotel.image,
        title: room.hotel.name,
        headline: `Room ${room.number} was viewed.`,
        room: room.id,
        tag: tag?.id,
      },
    });
  }

  const links = await Link.find({
    $or: [{ room }, room.group && { group: room.group }].filter(Boolean),
  });

  return { ...room.toJSON(), ...removeNullFields(room.group), links: reorderItems(links.filter((l) => l.isActive)) };
};

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
  return Room.create(body).then((t) => t.populate(roomPopulate));
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
