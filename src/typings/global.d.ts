import { IUser } from '../models/User/user.types';

declare global {
  namespace Express {
    interface Request {
      user: Pick<IUser, 'firstName' | 'lastName' | 'isVerified' | 'emails' | 'isAdmin'> & {
        id?: string;
      };
      auth?: {
        continueOnFail?: boolean;
      };
    }
  }
}
