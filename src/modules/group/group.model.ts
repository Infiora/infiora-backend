import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IGroupDoc, IGroupModel } from './group.interfaces';
import { Link } from '../link';

const groupSchema = new mongoose.Schema<IGroupDoc, IGroupModel>(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Hotel',
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
    price: {
      type: String,
    },
    theme: {
      type: String,
    },
    layout: {
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
groupSchema.plugin(toJSON);
groupSchema.plugin(paginate);

groupSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const group = this;
  const links = await Link.find({ group: group._id });
  await Promise.all(links.map((l) => l.deleteOne()));
});

// Create the model
const Group = mongoose.model<IGroupDoc, IGroupModel>('Group', groupSchema);

export default Group;
