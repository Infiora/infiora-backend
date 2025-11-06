import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IRoomDoc, IRoomModel } from './room.interfaces';
import Link from '../link/link.model';
import config from '../../config/config';

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
      default: true,
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
    popup: Object,
    newsletter: Object,
    feedback: Object,
  },
  {
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

roomSchema.virtual('url').get(function () {
  return `${config.urls.app}/${this.id}`;
});

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
