import { ConnectionDocument, ConnectionModel } from './Connection/connections.types';
import { UserDocument, UserModel } from './User/user.types';

import ConnectionSchema from './Connection/connection.schema';
import { ProfileDocument } from './Profile/profile.types';
import ProfileSchema from './Profile/profile.schema';
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

export const Connection = model<ConnectionDocument, ConnectionModel>(
  'Connection',
  ConnectionSchema
);
export const Profile = model<ProfileDocument>('Profile', ProfileSchema);
export const User = model<UserDocument, UserModel>('User', UserSchema);
