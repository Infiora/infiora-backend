import { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface ITeam {
  superAdmin: ObjectId;
  admins: ObjectId[];
  stripeCustomer: string;
  stripeSubscription: string;
  company?: string;
  logo?: string;
  totalMembers: number;
}

export interface ITeamDoc extends ITeam, Document {}

export interface ITeamModel extends Model<ITeamDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateTeamBody = Partial<ITeam>;
