import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ILeadDoc, ILeadModel } from './lead.interfaces';

const leadSchema = new mongoose.Schema<ILeadDoc, ILeadModel>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
    type: {
      type: String,
      enum: ['Manual', 'Business Card', 'User to User', 'Lead Capture'],
      default: 'Manual',
    },
    image: String,
    cover: String,
    logo: String,
    latitude: Number,
    longitude: Number,
    data: Object,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
leadSchema.plugin(toJSON);
leadSchema.plugin(paginate);

const Lead = mongoose.model<ILeadDoc, ILeadModel>('Lead', leadSchema);

export default Lead;
