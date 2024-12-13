import mongoose, { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { AccessAndRefreshTokens } from '../token/token.interfaces';
// eslint-disable-next-line import/no-cycle
import { IProfile, IProfileDoc } from '../profile/profile.interfaces';
import { IIntegration } from '../integration/integration.interfaces';

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
  live: ObjectId | IProfile | IProfileDoc;
  template: any;
  fcmToken?: string;
  isLocked?: boolean;
  subscription?: string;
  leads?: ObjectId[];
  team?: any;
  languageCode?: string;
  stripeCustomer: string;
  stripeSubscription?: string;
  integrations?: IIntegration[];
}

export interface IUserDoc extends IUser, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  isUsernameTaken(username: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateUserBody = Partial<IUser>;

export type NewRegisteredUser = {
  name: string;
  email: string;
  username?: string;
  password: string;
  jobTitle?: string;
  company?: string;
  linkEmail?: string;
  linkPhone?: string;
};

export type NewCreatedUser = {
  name?: string;
  email?: string;
  password: string;
  role?: string;
  subscription?: string;
};

export interface IUserWithTokens {
  user: IUserDoc;
  tokens: AccessAndRefreshTokens;
}
