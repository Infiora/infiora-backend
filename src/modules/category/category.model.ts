import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ICategoryDoc, ICategoryModel } from './category.interfaces';
import Platform from '../platform/platform.model';

const categorySchema = new mongoose.Schema<ICategoryDoc, ICategoryModel>(
  {
    position: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platforms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Platform',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

/**
 * Check if categoryname is taken
 * @param {string} categoryname - The category's categoryname
 * @param {ObjectId} [excludeCategoryId] - The id of the category to be excluded
 * @returns {Promise<boolean>}
 */
categorySchema.static('isNameTaken', async function (name: string, excludeCategoryId: mongoose.ObjectId): Promise<boolean> {
  const category = await this.findOne({ name, _id: { $ne: excludeCategoryId } });
  return !!category;
});

categorySchema.pre('deleteOne', { document: true, query: false }, async function () {
  const category = this;
  const platforms = await Platform.find({ category: category._id });
  await Promise.all(platforms.map((platform) => platform.deleteOne()));
});

const Category = mongoose.model<ICategoryDoc, ICategoryModel>('Category', categorySchema);

export default Category;
