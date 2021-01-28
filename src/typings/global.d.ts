import { User } from '../models/User/user.types';

declare global {
  namespace Express {
    interface Request {
      user: Pick<User, 'firstName' | 'lastName' | 'isVerified' | 'email' | 'isAdmin'> & {
        id?: string;
      };
      auth?: {
        continueOnFail?: boolean;
      };
    }
  }
}
