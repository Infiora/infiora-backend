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
    action: {
      type: String,
      required: true,
      enum: ['view', 'tap'],
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
