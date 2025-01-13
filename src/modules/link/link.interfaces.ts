import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IItem {
  id: string;
  title: string;
  value: string;
  type: string;
  data?: any;
}
interface IBaseLink {
  title?: string;
  value: string;
  type: string;
  items?: IItem[];
  image?: string;
  imageType?: 'image' | 'icon' | 'url';
  isActive: boolean;
  data?: any;
}

export interface ILink extends IBaseLink {
  room?: string;
  group?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILinkDoc extends ILink, Document {}

export interface ILinkModel extends Model<ILinkDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateLinkBody = Partial<IBaseLink>;

export type NewCreatedLink = Omit<ILink, 'position' | 'isActive' | 'createdAt' | 'updatedAt'>;
