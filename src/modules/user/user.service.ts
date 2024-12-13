import httpStatus from 'http-status';
import mongoose, { isValidObjectId } from 'mongoose';
import { json2csv } from 'json-2-csv';
import User from './user.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedUser, IUserDoc, UpdateUserBody } from './user.interfaces';
import Profile from '../profile/profile.model';
import { stripeService } from '../stripe';
import { generateUsername } from '../utils';

const generateUniqueUsername = async (): Promise<string> => {
  const username = generateUsername(8);
  const isTaken = await User.isUsernameTaken(username);

  if (isTaken) {
    return generateUniqueUsername();
  }

  return username;
};

const populate = [
  {
    path: 'live',
    populate: {
      path: 'direct',
      populate: {
        path: 'platform',
      },
    },
  },
  {
    path: 'team',
  },
  {
    path: 'template',
    populate: {
      path: 'direct',
      populate: {
        path: 'platform',
      },
    },
  },
];

/**
 * Create a user
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const createUser = async (userBody: NewCreatedUser): Promise<IUserDoc> => {
  const body: any = { ...userBody };
  if (body.email && (await User.isEmailTaken(body.email))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (body.username && (await User.isUsernameTaken(body.username))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  const username = await generateUniqueUsername();
  if (!body.username) {
    body.username = username;
  }
  if (!body.email) {
    body.email = `${username}@infiora.hr`;
  }
  const user = await User.create(body).then((t) => t.populate(populate));
  const profile = await Profile.create({
    user: user.id,
    ...body,
  });
  const stripeCustomer = await stripeService.createCustomer({ email: body.email, name: body.name });
  user.live = profile.id;
  user.stripeCustomer = stripeCustomer.id;
  await user.save().then((t) => t.populate(populate));
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryUsers = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const users = await User.paginate(filter, { ...options, populate: 'live.direct.platform,team,template.direct.platform' });
  return users;
};

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserById = async (id: mongoose.Types.ObjectId): Promise<IUserDoc | null> =>
  User.findById(id).populate(populate);

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmail = async (email: string): Promise<IUserDoc | null> => User.findOne({ email }).populate(populate);

/**
 * Get user by username
 * @param {string} username
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByUsername = async (username: string): Promise<IUserDoc | null> =>
  User.findOne({ username }).populate(populate);

/**
 * Get user by id
 * @param {string} id
 * @returns {Promise<IUserDoc | null>}
 */
export const getUser = async (id: string): Promise<IUserDoc | null> =>
  isValidObjectId(id) ? getUserById(new mongoose.Types.ObjectId(id)) : getUserByUsername(id);

/**
 * Update user by id
 * @param {mongoose.Types.ObjectId} userId
 * @param {UpdateUserBody} updateBody
 * @returns {Promise<IUserDoc | null>}
 */
export const updateUserById = async (
  userId: mongoose.Types.ObjectId,
  updateBody: UpdateUserBody
): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.username && (await User.isUsernameTaken(updateBody.username, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }

  Object.assign(user, updateBody);
  await user.save().then((t) => t.populate(populate));
  return user;
};

/**
 * Delete user by id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IUserDoc | null>}
 */
export const deleteUserById = async (userId: mongoose.Types.ObjectId): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.deleteOne();
  return user;
};

/**
 * Export users in csv
 * @returns {Promise<string | null>}
 */
export const exportUsers = async (): Promise<string | null> => {
  const users = await User.find({}).lean();
  const csvData = json2csv(users);

  return csvData;
};

/**
 * Add integration by key
 * @param {mongoose.Types.ObjectId} userId
 * @param {Object} body
 * @returns {Promise<IUserDoc | null>}
 */
export const addIntegration = async (
  userId: mongoose.Types.ObjectId,
  body: { key: string; data: any }
): Promise<IUserDoc | null> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const existingIntegration = user.integrations?.find((i) => i.key === body.key);

  if (existingIntegration) {
    existingIntegration.data = { ...existingIntegration.data, ...body.data };
  } else {
    if (!user.integrations) {
      user.integrations = [];
    }
    user.integrations.push(body);
  }

  await user.save();

  return user;
};

/**
 * Remove integration by key
 * @param {mongoose.Types.ObjectId} userId
 * @param {Object} body
 * @returns {Promise<IUserDoc | null>}
 */
export const removeIntegration = async (
  userId: mongoose.Types.ObjectId,
  body: { key: string }
): Promise<IUserDoc | null> => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $pull: { integrations: { key: body.key } },
    },
    { new: true }
  );

  return updatedUser;
};

export const duplicateUser = async (userId: mongoose.Types.ObjectId) => {
  const user = await User.findById(userId).select('-createdAt -updatedAt');
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const { template, team } = user;
  const newUser = await createUser({ password: 'asdf1122' });
  await User.findByIdAndUpdate(newUser.id, { template, team });
};
