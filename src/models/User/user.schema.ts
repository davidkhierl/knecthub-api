import {
  createAccessToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  createToken,
} from './user.method';

import { Schema } from 'mongoose';
import Token from '../Token';
import { UserDocument } from './user.types';
import { findByPrimaryEmail } from './user.statics';

const UserSchema = new Schema<UserDocument>({
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
  emails: [
    {
      email: {
        type: String,
        trim: true,
        required: true,
      },
      type: {
        type: String,
        trim: true,
        required: true,
      },
      confirmed: {
        type: Boolean,
        trim: true,
        default: false,
      },
      isVisible: {
        type: Boolean,
        trim: true,
      },
      _id: false,
    },
  ],
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
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
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
UserSchema.statics.findByPrimaryEmail = findByPrimaryEmail;

// Post delete hooks
UserSchema.post('findOneAndDelete', async function (user: UserDocument) {
  // delete user associated tokens.
  await Token.deleteMany({ user: user.id });
});

export default UserSchema;
