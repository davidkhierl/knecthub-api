import { IUser, UserDocument } from '../models/User/user.types';

declare global {
  namespace Express {
    // interface Request {
    //   user: UserDocument;
    //   auth?: {
    //     continueOnFail?: boolean;
    //   };
    // }
    interface User extends UserDocument {}
  }
}
