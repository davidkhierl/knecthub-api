import moment from 'moment';
import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
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

export default TokenSchema;
