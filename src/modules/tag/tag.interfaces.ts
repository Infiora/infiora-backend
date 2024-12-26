import { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface ITag {
  batch: ObjectId;
  user?: ObjectId;
  name?: string;
  url?: string;
  type?: string;
  isActive: boolean;
}

export interface ITagDoc extends ITag, Document {}

export interface ITagModel extends Model<ITagDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateTagBody = Partial<ITag>;

export type NewCreatedTag = Omit<ITag, 'user' | 'name' | 'url' | 'isActive' | 'type'>;
