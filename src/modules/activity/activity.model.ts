import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IActivityDoc, IActivityModel } from './activity.interfaces';

const activitySchema = new mongoose.Schema<IActivityDoc, IActivityModel>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Hotel',
    },
    action: {
      type: String,
      required: true,
      enum: ['view', 'tap', 'feedback'],
    },
    details: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Add plugins to the schema
activitySchema.plugin(toJSON);
activitySchema.plugin(paginate);

// Create the model
const Activity = mongoose.model<IActivityDoc, IActivityModel>('Activity', activitySchema);

export default Activity;
