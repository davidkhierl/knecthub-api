import { Document, Model } from 'mongoose';

import { IToken } from '../Token/token.types';

export interface IUserEmails {
  email: string;
  type: 'primary' | 'secondary' | 'pendingPrimary';
  confirmed?: boolean;
  isVisible?: boolean;
}

export interface IUser {
  emails: IUserEmails[];
  firstName: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  lastName: string;
  linkedInId?: string;
  password: string;
  profile?: {
    bio?: string;
    company?: string;
    contactNumber?: string;
    coverPhoto?: string;
    jobTitle?: string;
    location?: string;
    profilePicture?: string;
  };
}

export interface UserMethod {
  createAccessToken: () => Promise<{ accessToken: string; refreshToken: string }>;
  createEmailVerificationToken: (expiresIn?: Date) => Promise<string>;
  createPasswordResetToken: () => Promise<string>;
  createToken: (type: IToken['type'], expiresIn?: Date) => Promise<string>;
}

export interface UserVirtual {
  fullName?: string;
}

export interface UserDocument extends IUser, UserVirtual, UserMethod, Document {}

export type UserModel = Model<UserDocument>;
