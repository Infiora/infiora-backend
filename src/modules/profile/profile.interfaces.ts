import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

interface IField {
  name: string;
  placeholder?: string;
  label?: string;
  isRequired?: boolean;
  position?: number;
}

interface ILeadCapture {
  header?: string;
  button?: string;
  disclaimer?: string;
  defaultFields: IField[];
  fields?: IField[];
}

interface IBaseProfile {
  user: mongoose.Types.ObjectId;
  title?: string;
  layout?: string;
  image?: string;
  cover?: string;
  logo?: string;
  pronouns?: string;
  name?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  theme?: string;
  themeLinks?: string;
  location?: string;
  sectionTitle?: string;
  isLeadCapture?: boolean;
  leadCapture?: ILeadCapture;
  isDirect?: boolean;
  direct?: string;
  qrTheme?: string;
  qrLogo?: string;
}

export interface IProfile extends IBaseProfile {
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for the Profile document that extends IProfile and Document
export interface IProfileDoc extends IProfile, Document {}

// Interface for the Profile model that extends Model<IProfileDoc>
export interface IProfileModel extends Model<IProfileDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

// Type for updating a profile with partial data
export type UpdateProfileBody = Partial<IBaseProfile>;

// Type for a newly created profile
export type NewCreatedProfile = IBaseProfile;
