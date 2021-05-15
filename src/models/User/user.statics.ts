import { QueryOptions, UpdateQuery } from 'mongoose';

import { User } from '..';
import { UserDocument } from './user.types';

export async function findByEmail(email: string) {
  return await User.findOne({ email }).populate('profile');
}

export async function findByEmailAndUpdate(
  email: string,
  update?: UpdateQuery<UserDocument> | undefined,
  options?: QueryOptions | null | undefined
) {
  return await User.findOneAndUpdate({ email }, update, options);
}
