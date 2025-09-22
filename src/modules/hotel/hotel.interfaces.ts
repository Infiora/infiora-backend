import { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IHotel {
  manager?: ObjectId;
  user: ObjectId;
  name?: string;
  description?: string;
  note?: string;
  activeUntil?: string;
  image?: string;
  cover?: string;
  socialLinks?: string[];
  isActive?: boolean;
}

export interface IHotelDoc extends IHotel, Document {}

export interface IHotelModel extends Model<IHotelDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateHotelBody = Partial<IHotel>;

export type NewCreatedHotel = Omit<IHotel, 'isActive'>;
