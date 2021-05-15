import { Document, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { IProfile } from '../Profile/profile.types';
import { IToken } from '../Token/token.types';

export interface IUser {
  /**
   * User email.
   */
  email: string;
  /**
   * User email status.
   */
  emailVerified?: boolean;
  /**
   * User first name.
   */
  firstName: string;
  /**
   * User last name.
   */
  lastName?: string;
  /**
   * User password.
   */
  password: string;
  /**
   * User profile.
   */
  profile?: IProfile;
  /**
   * Google Id
   */
  googleId?: string;
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
   * Find user by email.
   */
  findByEmail: (email: string) => Promise<UserDocument | null>;
  /**
   * Find user by email.
   */
  findByEmailAndUpdate: (
    email: string,
    update?: UpdateQuery<UserDocument> | undefined,
    options?: QueryOptions | null | undefined
  ) => Promise<UserDocument | null>;
}
