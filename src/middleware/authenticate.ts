import { User } from '../models';
import config from '../config';
import express from 'express';
import { generateAccessToken } from '../utils/token.utils';
import jwt from 'jsonwebtoken';
import { pick } from 'lodash';

interface DecodedAccessToken {
  sub: string;
  name: string;
  admin?: boolean;
}

/**
 * A middleware to let the request continue if the authentication failed.
 * @param req Express request
 * @param _res Express response
 * @param next Express next
 */
export const authContinueOnFail = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  req.auth = {
    continueOnFail: true,
  };
  next();
};

/**
 * Authentication middleware.
 * @param req Express request
 * @param res Express response
 * @param next Express next
 */
async function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { accessToken, refreshToken }: { accessToken: string; refreshToken: string } = req.cookies;

  if (!accessToken || !refreshToken) {
    if (req.auth && req.auth.continueOnFail) {
      return next();
    } else {
      return res.status(401).send('Unauthorized: Missing token.');
    }
  }

  try {
    const decodedAccessToken = jwt.verify(accessToken, config.JWT_SECRET) as DecodedAccessToken;

    if (typeof decodedAccessToken !== 'object')
      return res.status(401).send('Unauthorized: Invalid jwt payload.');

    const user = await User.findById(decodedAccessToken.sub);

    if (!user) return res.status(401).send('Unauthorized: Invalid user.');

    req.user = pick(user.toObject({ getters: true }), [
      'emails',
      'firstName',
      'id',
      'isAdmin',
      'isVerified',
      'lastName',
    ]);

    next();
  } catch (error) {
    try {
      const decodedAccessToken = jwt.verify(accessToken, config.JWT_SECRET, {
        ignoreExpiration: true,
      }) as DecodedAccessToken;

      if (typeof decodedAccessToken !== 'object')
        return res.status(401).send('Unauthorized: Invalid jwt payload');

      const [newAccessToken, newRefreshToken] = await generateAccessToken(
        decodedAccessToken.sub,
        refreshToken
      );

      const user = await User.findById(decodedAccessToken.sub);

      if (user)
        req.user = pick(user.toObject({ getters: true }), [
          'emails',
          'firstName',
          'id',
          'isAdmin',
          'isVerified',
          'lastName',
        ]);

      res
        .cookie('accessToken', newAccessToken, {
          httpOnly: true,
          expires: config.COOKIE_EXPIRATION,
        })
        .cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          expires: config.COOKIE_EXPIRATION,
        });

      next();
    } catch (error) {
      return res.status(401).send(error.message);
    }
  }
}

export default authenticate;
