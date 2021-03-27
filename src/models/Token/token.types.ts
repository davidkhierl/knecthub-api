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

interface TokenMethod {}

export interface TokenDocument extends IToken, TokenMethod, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type TokenModel = Model<TokenDocument>;
