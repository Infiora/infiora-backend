import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

interface IField {
  name: string;
  placeholder?: string;
  value?: string;
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

interface IBaseTemplate {
  title?: string;
  layout?: string;
  image?: string;
  cover?: string;
  logo?: string;
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

export interface ITemplate extends IBaseTemplate {
  team: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for the Template document that extends ITemplate and Document
export interface ITemplateDoc extends ITemplate, Document {}

// Interface for the Template model that extends Model<ITemplateDoc>
export interface ITemplateModel extends Model<ITemplateDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

// Type for updating a template with partial data
export type UpdateTemplateBody = Partial<IBaseTemplate>;

// Type for a newly created template
export type NewCreatedTemplate = IBaseTemplate;
