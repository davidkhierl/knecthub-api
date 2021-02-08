import { Document, Model } from 'mongoose';
import { IUser, UserDocument } from '../User/user.types';

export interface IConnection {
  sender: IUser;
  status: 'pending' | 'accepted' | 'ignored';
  receiver: IUser;
}

export interface ConnectionDocument extends IConnection, Document {}

export interface ConnectionModel extends Model<ConnectionDocument> {
  findUserConnections: (user: UserDocument) => Promise<ConnectionDocument[]>;
}
