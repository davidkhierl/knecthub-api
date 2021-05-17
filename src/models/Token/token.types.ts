import { Document, Model, Types } from 'mongoose';

import { UserDocument } from '../User/user.types';

export interface IToken {
  user: Types.ObjectId | UserDocument['_id'];
  token: string;
  type: 'email_verification' | 'password_reset' | 'refresh_token';
  consumed?: boolean;
  consumedAt?: Date;
  invalidated?: boolean;
  expiresIn?: Date;
}

export interface TokenDocument extends IToken, Document {
  consumeToken: () => Promise<TokenDocument>;
  createdAt: Date;
  isTokenValid: () => boolean;
  updatedAt: Date;
}

export type TokenModel = Model<TokenDocument>;
