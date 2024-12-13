import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ISupportDoc, ISupportModel } from './support.interfaces';

const supportSchema = new mongoose.Schema<ISupportDoc, ISupportModel>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    category: {
      type: String,
      enum: ['general', 'feature'],
      default: 'general',
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['opened', 'closed', 'resolved'],
      default: 'opened',
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins to the schema
supportSchema.plugin(toJSON);
supportSchema.plugin(paginate);

// Create the model
const Support = mongoose.model<ISupportDoc, ISupportModel>('Support', supportSchema);

export default Support;
