import { ProfileDocument } from './profile.types';
import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema<ProfileDocument>({
  bio: { type: String, trim: true },
  company: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  coverPhoto: { type: String, trim: true },
  jobTitle: { type: String, trim: true },
  location: { type: String, trim: true },
  profilePicture: { type: String, trim: true },
  avatarBgColor: { type: String, trim: true },
});

export default ProfileSchema;
