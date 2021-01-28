import {
  generateAccessToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from './user.method';

import Token from '../Token';
import { UserDocument } from './user.types';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema<UserDocument>({
  firstName: {
    type: String,
    trim: true,
    required: true,
  },
  lastName: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    private: true,
  },
  isAdmin: Boolean,
  isVerified: {
    type: Boolean,
    default: false,
  },
  linkedInId: {
    type: String,
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
});

// fullName virtual
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// methods
UserSchema.methods.generateEmailVerificationToken = generateEmailVerificationToken;
UserSchema.methods.generatePasswordResetToken = generatePasswordResetToken;
UserSchema.methods.generateAccessToken = generateAccessToken;

// create the user profile.
// UserSchema.post('save', function (user: UserDocument) {
//   return Profile.create({ user: user.id });
// });

// delete user associated documents.
UserSchema.post('findOneAndDelete', async function (user: UserDocument) {
  // delete user associated tokens.
  await Token.deleteMany({ user: user.id });
});

export default UserSchema;
