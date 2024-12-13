import mongoose, { Document, Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IPlatformDoc } from '../platform/platform.interfaces';

interface IBaseLink {
  title?: string;
  headline?: string;
  image?: string;
  file?: string;
  data?: string;
  value: string;
  isActive: boolean;
  isContact: boolean;
}

export interface ILink extends IBaseLink {
  profile?: mongoose.Types.ObjectId;
  template?: mongoose.Types.ObjectId;
  platform: IPlatformDoc;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILinkDoc extends ILink, Document {}

export interface ILinkModel extends Model<ILinkDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateLinkBody = Partial<IBaseLink>;

export type NewCreatedLink = Omit<ILink, 'updatedAt' | 'createdAt' | 'position' | 'isContact' | 'isActive'>;
