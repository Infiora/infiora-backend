import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ITemplateDoc, ITemplateModel } from './template.interfaces';
import Product from '../product/product.model';
import Link from '../link/link.model';

const defaultFields = [
  {
    name: 'name',
    placeholder: 'Full Name',
    isRequired: true,
    position: 0,
  },
  {
    name: 'email',
    placeholder: 'Email',
    isRequired: true,
    position: 1,
  },
  {
    name: 'phone',
    placeholder: 'Phone',
    isRequired: false,
    position: 2,
  },
  {
    name: 'jobTitle',
    placeholder: 'Job Title',
    isRequired: false,
    position: 3,
  },
  {
    name: 'company',
    placeholder: 'Company',
    isRequired: false,
    position: 4,
  },
  {
    name: 'note',
    placeholder: 'Note',
    isRequired: false,
    position: 5,
  },
];

const fieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    placeholder: String,
    value: String,
    isRequired: Boolean,
    position: Number,
  },
  { _id: false }
);

const leadCaptureSchema = new mongoose.Schema(
  {
    heading: String,
    button: String,
    disclaimer: String,
    fields: {
      type: [fieldSchema],
      default: defaultFields,
    },
    defaultFields: {
      type: [fieldSchema],
      default: defaultFields,
    },
  },
  {
    _id: false,
  }
);

const templateSchema = new mongoose.Schema<ITemplateDoc, ITemplateModel>(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    title: { type: String, default: 'New Card' },
    bio: String,
    theme: String,
    themeLinks: String,
    layout: {
      type: String,
      enum: ['center', 'left'],
      default: 'center',
    },
    location: String,
    company: String,
    image: String,
    cover: String,
    logo: String,
    sectionTitle: {
      type: String,
      default: 'Products',
    },
    leadCapture: {
      type: leadCaptureSchema,
      default: {},
    },
    isLeadCapture: {
      type: Boolean,
      default: false,
    },
    isDirect: {
      type: Boolean,
      default: false,
    },
    direct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
    },
    qrTheme: String,
    qrLogo: String,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
templateSchema.plugin(toJSON);
templateSchema.plugin(paginate);

templateSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const template = this;
  const links = await Link.find({ template: template._id });
  await Promise.all(links.map((l) => l.deleteOne()));

  const products = await Product.find({ template: template._id });
  await Promise.all(products.map((p) => p.deleteOne()));
});

const Template = mongoose.model<ITemplateDoc, ITemplateModel>('Template', templateSchema);

export default Template;
