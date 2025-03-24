import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IRoomDoc, IRoomModel } from './room.interfaces';
import Link from '../link/link.model';

const roomSchema = new mongoose.Schema<IRoomDoc, IRoomModel>(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Hotel',
    },
    number: {
      type: String,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    orderedLinks: [String],
    background: {
      color: { type: String },
      direction: { type: String },
      type: { type: String },
    },
    font: {
      color: { type: String },
      family: { type: String },
    },
    button: {
      color: { type: String },
      backgroundColor: { type: String },
      variant: { type: String },
      borderRadius: { type: String },
    },
    popup: {
      message: { type: String },
      buttonText: { type: String },
      link: { type: String },
      color: { type: String },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    newsletter: {
      message: { type: String },
      successMessage: { type: String },
      buttonText: { type: String },
      mainButtonText: { type: String },
      type: { type: String },
      color: { type: String },
      image: String,
      imageType: {
        type: String,
        enum: ['none', 'icon', 'image', 'url'],
        default: 'none',
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins to the schema
roomSchema.plugin(toJSON);
roomSchema.plugin(paginate);

roomSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const room = this;
  const links = await Link.find({ room: room._id });
  await Promise.all(links.map((l) => l.deleteOne()));
});

// Create the model
const Room = mongoose.model<IRoomDoc, IRoomModel>('Room', roomSchema);

export default Room;
