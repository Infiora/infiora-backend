import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IHotelDoc } from '../hotel/hotel.interfaces';

export interface IGroup {
  hotel: IHotelDoc;
  title?: string;
  description?: string;
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
    isActive?: boolean;
  };
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
