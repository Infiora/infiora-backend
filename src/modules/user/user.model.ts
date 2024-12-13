import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { roles } from '../../config/roles';
import { IUserDoc, IUserModel } from './user.interfaces';
import Profile from '../profile/profile.model';
import Lead from '../lead/lead.model';
import Tag from '../tag/tag.model';
import { Activity } from '../activity';

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.matches(value, '^[a-zA-Z0-9_.-]*$')) {
          throw new Error('Invalid username');
        }
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    subscription: {
      type: String,
      enum: ['', 'pro', 'premium', 'team'],
      default: '',
    },
    fcmToken: String,
    isLocked: Boolean,
    live: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    languageCode: {
      type: String,
      default: 'en',
    },
    stripeCustomer: String,
    stripeSubscription: String,
    integrations: {
      type: [
        {
          key: {
            type: String,
            unique: true,
            required: true,
          },
          data: Object,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.static('isEmailTaken', async function (email: string, excludeUserId: mongoose.ObjectId): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
});

/**
 * Check if username is taken
 * @param {string} username - The user's username
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.static('isUsernameTaken', async function (username: string, excludeUserId: mongoose.ObjectId): Promise<boolean> {
  const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
  return !!user;
});

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
  const user = this;
  return bcrypt.compare(password, user.password);
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const user = this;
  const profiles = await Profile.find({ user: user._id });
  await Promise.all(profiles.map((p) => p.deleteOne()));

  const leads = await Lead.find({ user: user._id });
  await Promise.all(leads.map((l) => l.deleteOne()));

  const activities = await Activity.find({ user: user._id });
  await Promise.all(activities.map((a) => a.deleteOne()));

  const tags = await Tag.find({ user: user._id });
  await Promise.all(tags.map((t) => t.updateOne({ $unset: { user: 1 } })));
});

const User = mongoose.model<IUserDoc, IUserModel>('User', userSchema);

export default User;
