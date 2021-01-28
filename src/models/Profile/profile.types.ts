import { Document, Model } from 'mongoose';

export interface Profile {
  avatarBgColor?: string;
  bio?: string;
  company?: string;
  contactNumber?: string;
  coverPhoto?: string;
  jobTitle?: string;
  location?: string;
  profilePicture?: string;
}

export interface ProfileMethod {}

export interface ProfileVirtual {}

export type ProfileDocument = Profile & ProfileVirtual & ProfileMethod & Document;

export type ProfileModel = Model<ProfileDocument>;
