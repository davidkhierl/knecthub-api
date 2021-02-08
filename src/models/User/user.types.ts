import { Document, Model } from 'mongoose';

import { IProfile } from '../Profile/profile.types';
import { IToken } from '../Token/token.types';

export interface IUserEmail {
  email: string;
  type: 'primary' | 'secondary' | 'pendingPrimary';
  confirmed?: boolean;
  isVisible?: boolean;
}

export interface IUser {
  emails: IUserEmail[];
  firstName: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  lastName: string;
  linkedInId?: string;
  password: string;
  profile?: IProfile;
}

export interface UserDocument extends IUser, Document {
  /**
   * Create access token.
   */
  createAccessToken: () => Promise<{ accessToken: string; refreshToken: string }>;
  /**
   * Create email verification token.
   */
  createEmailVerificationToken: (expiresIn?: Date) => Promise<string>;
  /**
   * Create password reset token.
   */
  createPasswordResetToken: () => Promise<string>;
  /**
   * Create token.
   */
  createToken: (type: IToken['type'], expiresIn?: Date) => Promise<string>;
  /**
   * User full name.
   */
  fullName?: string;
}

export interface UserModel extends Model<UserDocument> {
  /**
   * Find user by primary email.0
   */
  findByPrimaryEmail: (email: string) => Promise<UserDocument>;
}
