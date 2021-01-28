import mongoose, { Document, Model, Types } from 'mongoose';

export interface ConnectionBase {
  userId?: string | Types.ObjectId;
  // contacts?: { user: string }[];
  friends?: { user: string }[];
}

type ConnectionSchema = ConnectionBase & Document;

interface ConnectionModel extends Model<ConnectionSchema> {}

const ConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    friends: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        // name: {
        //     type: String,
        // },
        profileImage: {
          type: String,
        },
        status: {
          type: Boolean,
          default: false,
        },
        sentByMe: {
          type: Boolean,
          default: 0,
        },
        profile: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Profile',
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ConnectionSchema, ConnectionModel>(
  'Connection',
  ConnectionSchema
);

// import mongoose, { Document, Model } from "mongoose";

// export interface ConnectionBase {
//     user?: string;
//     contacts: { user: string }[];
// }

// type ConnectionSchema = ConnectionBase & Document;

// interface ConnectionModel extends Model<ConnectionSchema> {}

// const ConnectionSchema = new mongoose.Schema(
//     {
//         userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         contacts: {
//             type: Array,
//             user: mongoose.Schema.Types.ObjectId,
//         },
//          contacts: [
//             {
//                   toUserId: {
//                      type: mongoose.Schema.Types.ObjectId,
//                      ref: "User",
//                      required: true,
//                  },
//                  name: {
//                      type: String,
//                  },
//                  profileImage: {
//                      type: String,
//                  },
//                  status: {
//                      type: String,
//                  },
//                  sentByMe: {
//                      type: Boolean,
//                  },
//              }
//          ]
//     },
//     { timestamps: true }
// );

// export default mongoose.model<ConnectionSchema, ConnectionModel>(
//     "Connection",
//     ConnectionSchema
// );
