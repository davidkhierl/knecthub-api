import { ProfileDocument } from './Profile/profile.types';
import ProfileSchema from './Profile/profile.schema';
import { UserDocument } from './User/user.types';
import UserSchema from './User/user.schema';
import { model } from 'mongoose';
import mongoose from 'mongoose';
import normalizeToJson from '../plugins/mongoose/normalizeToJson';
import schemaDefaults from '../plugins/mongoose/schemaDefaults';

/* -------------------------------------------------------------------------- */
/*                                   Plugins                                  */
/* -------------------------------------------------------------------------- */

mongoose.plugin(schemaDefaults);
mongoose.plugin(normalizeToJson);

/* -------------------------------------------------------------------------- */
/*                                   Models                                   */
/* -------------------------------------------------------------------------- */

export const Profile = model<ProfileDocument>('Profile', ProfileSchema);
export const User = model<UserDocument>('User', UserSchema);
