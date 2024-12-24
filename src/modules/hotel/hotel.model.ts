import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IHotelDoc, IHotelModel } from './hotel.interfaces';

const hotelSchema = new mongoose.Schema<IHotelDoc, IHotelModel>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
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
hotelSchema.plugin(toJSON);
hotelSchema.plugin(paginate);

// Create the model
const Hotel = mongoose.model<IHotelDoc, IHotelModel>('Hotel', hotelSchema);

export default Hotel;
