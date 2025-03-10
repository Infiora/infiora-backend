import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IHotelDoc, IHotelModel } from './hotel.interfaces';
import { Room } from '../room';

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
    description: {
      type: String,
    },
    note: {
      type: String,
    },
    image: {
      type: String,
    },
    socialLinks: {
      type: [String],
      default: [],
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

hotelSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const hotel = this;
  const rooms = await Room.find({ hotel: hotel._id });
  await Promise.all(rooms.map((r) => r.deleteOne()));
});

// Create the model
const Hotel = mongoose.model<IHotelDoc, IHotelModel>('Hotel', hotelSchema);

export default Hotel;
