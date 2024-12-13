import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

interface IBaseProduct {
  title?: string;
  image?: string;
  description: string;
  url: string;
  price: string;
  isActive: boolean;
}

export interface IProduct extends IBaseProduct {
  profile?: string;
  template?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDoc extends IProduct, Document {}

export interface IProductModel extends Model<IProductDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateProductBody = Partial<IBaseProduct>;

export type NewCreatedProduct = Omit<IProduct, 'position' | 'isActive' | 'createdAt' | 'updatedAt'>;
