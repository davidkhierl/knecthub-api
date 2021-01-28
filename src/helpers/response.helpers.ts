import express, { CookieOptions } from 'express';

import { ValidationError } from 'express-validator';
import getRequestUrl from './getRequestUrl';

/**
 * Cookie helper for setting response and request cookies
 * @param props Configurations
 * @param res Express response object
 * @param req Express response object
 */
export const setResponseCookies = (
  props: {
    cookies: { name: string; value: string }[];
    options: CookieOptions;
    updateRequest?: boolean;
  },
  res: express.Response,
  req?: express.Request
) => {
  props.cookies.forEach((cookie) => {
    res.cookie(cookie.name, cookie.value, props.options);
  });

  if (props.updateRequest && req)
    props.cookies.forEach((cookie) => {
      req.cookies[cookie.name] = cookie.value;
    });

  if (props.updateRequest && !req)
    throw new Error('req parameter is required for updating the current request object');
};

export interface ResponseError {
  location?: 'body' | 'cookies' | 'headers' | 'params' | 'query' | undefined;
  message: any;
  param?: string;
  value?: string;
  nestedErrors?: ValidationError[] | unknown[] | undefined;
}

/**
 * Wrap errors to a new object
 * @param errors Array of response error
 * @returns New object
 */
export const responseErrors = (errors: ResponseError[] | ResponseError) => errors;

/**
 * Return the full url path of the given resources.
 * @param req Express request object.
 * @param path Path of the resource.
 */
export const resourceLocation = (req: express.Request, path?: string | string[]) => {
  const serverUrl = getRequestUrl(req);
  const resourcePath = path && Array.isArray(path) ? path.join('/') : path;
  return `${serverUrl}${resourcePath ? `/${resourcePath}` : ''}`;
};
