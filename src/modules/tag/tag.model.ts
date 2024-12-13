import mongoose from 'mongoose';
import config from '../../config/config';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ITagDoc, ITagModel } from './tag.interfaces';

const tagSchema = new mongoose.Schema<ITagDoc, ITagModel>(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Batch',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customId: {
      type: String,
    },
    name: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    type: String,
  },
  {
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

tagSchema.virtual('url').get(function () {
  return `${config.clientUrl}/${this.customId ? this.customId : this.id}`;
});

/**
 * Check if custom id is taken
 * @param {string} customId - The tag's customId
 * @param {ObjectId} [excludeTagId] - The id of the tag to be excluded
 * @returns {Promise<boolean>}
 */
tagSchema.static('isCustomIdTaken', async function (customId: string, excludeTagId: mongoose.ObjectId): Promise<boolean> {
  const tag = await this.findOne({ customId, _id: { $ne: excludeTagId } });
  return !!tag;
});

// add plugin that converts mongoose to json
tagSchema.plugin(toJSON);
tagSchema.plugin(paginate);

const Tag = mongoose.model<ITagDoc, ITagModel>('Tag', tagSchema);

export default Tag;
