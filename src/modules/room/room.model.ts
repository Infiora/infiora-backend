import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IRoomDoc, IRoomModel } from './room.interfaces';

const roomSchema = new mongoose.Schema<IRoomDoc, IRoomModel>(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Hotel',
    },
    number: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
    },
    capacity: {
      type: Number,
    },
    amenities: {
      type: [String],
    },
    pricePerNight: {
      type: String,
    },
    images: {
      type: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins to the schema
roomSchema.plugin(toJSON);
roomSchema.plugin(paginate);

// Create the model
const Room = mongoose.model<IRoomDoc, IRoomModel>('Room', roomSchema);

export default Room;
