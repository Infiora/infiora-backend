import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { IPlatformDoc, IPlatformModel } from './platform.interfaces';
import { Link } from '../link';

const platformSchema = new mongoose.Schema<IPlatformDoc, IPlatformModel>(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    position: { type: Number, default: 0 },
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    image: String,
    headline: String,
    webBaseURL: String,
    iOSBaseURL: String,
    androidBaseURL: String,
    type: {
      type: String,
      enum: ['contact', 'file', 'phone', 'url', 'email', 'username'],
      default: 'url',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
platformSchema.plugin(toJSON);
platformSchema.plugin(paginate);

/**
 * Check if platform title is taken
 * @param {string} title - The platform's title
 * @param {ObjectId} [excludePlatformId] - The id of the platform to be excluded
 * @returns {Promise<boolean>}
 */
platformSchema.static(
  'isTitleTaken',
  async function (title: string, excludePlatformId: mongoose.ObjectId): Promise<boolean> {
    const platform = await this.findOne({ title, _id: { $ne: excludePlatformId } });
    return !!platform;
  }
);

platformSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const platform = this;
  const links = await Link.find({ platform: platform._id });
  await Promise.all(links.map((link) => link.deleteOne()));
});

const Platform = mongoose.model<IPlatformDoc, IPlatformModel>('Platform', platformSchema);

export default Platform;
