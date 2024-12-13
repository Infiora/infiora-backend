import mongoose, { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IPlatform {
  category: ObjectId;
  position: number;
  title: string;
  image?: string;
  headline?: string;
  webBaseURL?: string;
  iOSBaseURL?: string;
  androidBaseURL?: string;
  type: string;
}

export interface IPlatformDoc extends IPlatform, Document {}

export interface IPlatformModel extends Model<IPlatformDoc> {
  isTitleTaken(title: string, excludePlatformId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdatePlatformBody = Partial<IPlatform>;

export type NewCreatedPlatform = Omit<IPlatform, 'position'>;
