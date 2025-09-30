import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IHotelDoc } from '../hotel/hotel.interfaces';

interface INewsletter {
  message?: string;
  successMessage?: string;
  buttonText?: string;
  mainButtonText?: string;
  type?: string;
  color?: string;
  image?: string;
  imageType?: 'none' | 'image' | 'icon' | 'url';
  isActive?: boolean;
}
export interface IFeedback {
  isActive?: boolean;
  emailRequirement?: 'none' | 'optional' | 'mandatory';
  textRequirement?: 'none' | 'optional' | 'mandatory';
  emails?: string[];
  googleMapsLink?: string;
}

export interface IRoom {
  hotel: IHotelDoc;
  url?: string;
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
  newsletter?: INewsletter;
  feedback?: IFeedback;
}

export interface IRoomDoc extends IRoom, Document {}

export interface IRoomModel extends Model<IRoomDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateRoomBody = Partial<IRoom>;

export type NewCreatedRoom = { hotel: string; quantity: number; start: number; suffix: string; prefix: string };

export const roomPopulate = [
  {
    path: 'hotel',
  },
  {
    path: 'group',
  },
];
