import { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IRoom {
  hotel: ObjectId;
  number?: string;
  name?: string;
  description?: string;
  type?: string;
  capacity?: number;
  amenities?: string[];
  price?: string;
  layout?: string;
  theme?: string;
  images?: string[];
  isActive?: boolean;
}

export interface IRoomDoc extends IRoom, Document {}

export interface IRoomModel extends Model<IRoomDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateRoomBody = Partial<IRoom>;

export type NewCreatedRoom = Omit<IRoom, 'isActive'>;
