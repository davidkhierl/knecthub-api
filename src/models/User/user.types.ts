import { Document, Model } from 'mongoose';

export interface UserEmails {
  email: string;
  type: 'primary' | 'secondary' | 'pendingPrimary';
  confirmed?: boolean;
  isVisible?: boolean;
}

export interface User {
  emails: UserEmails[];
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
  createEmailVerificationToken: (expiresIn?: Date) => Promise<string>;
  createPasswordResetToken: () => Promise<string>;
  createAccessToken: () => Promise<{ accessToken: string; refreshToken: string }>;
}

export interface UserVirtual {
  fullName?: string;
}

export interface UserDocument extends User, UserVirtual, UserMethod, Document {}

export type UserModel = Model<UserDocument>;
