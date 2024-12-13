import { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IUser } from '../user/user.interfaces';

export interface ISupport {
  user: ObjectId | IUser;
  category?: string;
  subject: string;
  message: string;
  status?: string;
}

export interface ISupportDoc extends ISupport, Document {}

export interface ISupportModel extends Model<ISupportDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateSupportBody = Partial<ISupport>;

export type NewCreatedSupport = Omit<ISupport, 'user' | 'status'>;
