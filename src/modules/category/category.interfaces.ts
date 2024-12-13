import mongoose, { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface ICategory {
  name: string;
  position: number;
  platforms?: ObjectId[];
}

export interface ICategoryDoc extends ICategory, Document {}

export interface ICategoryModel extends Model<ICategoryDoc> {
  isNameTaken(name: string, excludeCategoryId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateCategoryBody = Omit<ICategory, 'position' | 'platforms'>;

export type NewCreatedCategory = Omit<ICategory, 'position' | 'platforms'>;
