import { ConnectionDocument } from './connections.types';
import { Schema } from 'mongoose';
import { findUserConnections } from './connection.statics';

const ConnectionSchema = new Schema<ConnectionDocument>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// statics
ConnectionSchema.statics.findUserConnections = findUserConnections;

export default ConnectionSchema;
