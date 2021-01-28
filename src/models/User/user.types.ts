import { Document, Model } from 'mongoose';

export interface User {
  email: string;
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
  generateEmailVerificationToken: (expiresIn?: Date) => Promise<string>;
  generatePasswordResetToken: () => Promise<string>;
  generateAccessToken: () => Promise<{ accessToken: string; refreshToken: string }>;
}

export interface UserVirtual {
  fullName?: string;
}

export type UserDocument = User & UserVirtual & UserMethod & Document;

export type UserModel = Model<UserDocument>;
