import { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IFeedback {
  hotel: ObjectId;
  room: ObjectId;
  rating: number;
  email: string;
  message: string;
}

export interface IFeedbackDoc extends IFeedback, Document {}

export interface IFeedbackModel extends Model<IFeedbackDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type NewCreatedFeedback = IFeedback;
