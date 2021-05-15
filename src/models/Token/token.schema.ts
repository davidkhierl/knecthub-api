import { consumeToken, isTokenValid } from './token.method';

import { Schema } from 'mongoose';
import { TokenDocument } from './token.types';
import moment from 'moment';

const TokenSchema = new Schema<TokenDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    consumed: {
      type: Boolean,
      default: false,
    },
    consumedAt: {
      type: Date,
    },
    invalidated: {
      type: Boolean,
      default: false,
    },
    expiresIn: {
      type: Date,
      default: moment().add(1, 'hour').toDate(),
    },
  },
  { timestamps: true }
);

// methods
TokenSchema.methods.isTokenValid = isTokenValid;
TokenSchema.methods.consumeToken = consumeToken;

export default TokenSchema;
