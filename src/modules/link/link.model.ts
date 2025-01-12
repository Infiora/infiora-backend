import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ILinkDoc, ILinkModel } from './link.interfaces';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  value: String,
  type: { type: String, default: 'link' },
  data: Object,
});
itemSchema.plugin(toJSON);

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
    title: { type: String, required: true },
    value: String,
    type: { type: String, default: 'link' },
    icon: String,
    items: [itemSchema],
    data: Object,
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
