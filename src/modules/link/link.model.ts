import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ILinkDoc, ILinkModel } from './link.interfaces';

const linkSchema = new mongoose.Schema<ILinkDoc, ILinkModel>(
  {
    position: { type: Number, default: 0 },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    title: String,
    image: String,
    description: String,
    url: String,
    price: String,
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
linkSchema.plugin(toJSON);
linkSchema.plugin(paginate);

const Link = mongoose.model<ILinkDoc, ILinkModel>('Link', linkSchema);

export default Link;
