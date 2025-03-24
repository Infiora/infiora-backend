import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IHotelDoc } from '../hotel/hotel.interfaces';

export interface IRoom {
  hotel: IHotelDoc;
  number?: string;
  description?: string;
  isActive?: boolean;
  group?: any;
  orderedLinks?: string[];
  background?: {
    color?: string;
    direction?: string;
    type?: string;
  };
  font?: {
    color?: string;
    family?: string;
  };
  button?: {
    color?: string;
    backgroundColor?: string;
    variant?: string;
    borderRadius?: string;
  };
  popup?: {
    message?: string;
    buttonText?: string;
    link?: string;
    color?: string;
    isActive?: boolean;
  };
  newsletter?: {
    message?: string;
    successMessage?: string;
    buttonText?: string;
    mainButtonText?: string;
    type?: string;
    color?: string;
    image?: string;
    imageType?: 'none' | 'image' | 'icon' | 'url';
    isActive?: boolean;
  };
}

export interface IRoomDoc extends IRoom, Document {}

export interface IRoomModel extends Model<IRoomDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateRoomBody = Partial<IRoom>;

export type NewCreatedRoom = { hotel: string; quantity: number };

export const roomPopulate = [
  {
    path: 'hotel',
  },
  {
    path: 'group',
  },
];
