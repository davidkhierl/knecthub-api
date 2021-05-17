import { ValidationError } from 'express-validator';
import { IUser } from '../models/User/user.types';

interface ParamsDictionary {
  [key: string]: string;
}

/**
 * Standard API Response.
 */
interface StandardResponse<T = any> {
  /**
   * Response data.
   */
  data?: T | null;
  /**
   * Response errors.
   */
  errors?: ResponseError[];
  /**
   * Helpful response message.
   */
  message?: string;
  /**
   * Optional redirect url hint.
   */
  redirectUrl?: string;
  /**
   * Response status.
   */
  success?: boolean;
}

interface AuthSuccessResponse {
  user: IUser;
  accessToken: string;
  refreshToken?: string;
}

interface ResponseError {
  location?: 'body' | 'cookies' | 'headers' | 'params' | 'query' | undefined;
  message?: any;
  nestedErrors?: ValidationError[] | unknown[] | undefined;
  param?: string;
  value?: string;
}
