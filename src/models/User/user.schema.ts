import {
  createAccessToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  createToken,
} from './user.method';
import { findByEmail, findByEmailAndUpdate } from './user.statics';

import { Schema } from 'mongoose';
import Token from '../Token';
import { UserDocument } from './user.types';

const UserSchema = new Schema<UserDocument>({
  firstName: {
    type: String,
    trim: true,
    required: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    // required: true,
    private: true,
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  googleId: {
    type: String,
  },
});

// fullName virtual
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// methods
UserSchema.methods.createAccessToken = createAccessToken;
UserSchema.methods.createEmailVerificationToken = createEmailVerificationToken;
UserSchema.methods.createPasswordResetToken = createPasswordResetToken;
UserSchema.methods.createToken = createToken;

// statics
UserSchema.statics.findByEmail = findByEmail;
UserSchema.statics.findByEmailAndUpdate = findByEmailAndUpdate;

// Post delete hooks
UserSchema.post('findOneAndDelete', async function (user: UserDocument) {
  // delete user associated tokens.
  await Token.deleteMany({ user: user.id });
});

export default UserSchema;
