import { IUser, UserDocument } from '../models/User/user.types';

declare global {
  namespace Express {
    interface User extends UserDocument {}
  }
}
