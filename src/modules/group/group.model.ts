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
    title: {
      type: String,
      default: 'Group',
    },
    description: {
      type: String,
    },
    background: {
      color: { type: String },
      direction: { type: String },
      type: { type: String },
    },
    font: {
      color: { type: String },
    },
    button: {
      color: { type: String },
      backgroundColor: { type: String },
      variant: { type: String },
      borderRadius: { type: String },
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
