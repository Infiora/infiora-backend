import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IHotelDoc } from '../hotel/hotel.interfaces';

export interface IGroup {
  hotel: IHotelDoc;
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

export interface IGroupDoc extends IGroup, Document {}

export interface IGroupModel extends Model<IGroupDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateGroupBody = Partial<IGroup>;

export type NewCreatedGroup = Omit<IGroup, 'isActive'>;

export const groupPopulate = [
  {
    path: 'hotel',
  },
];
