import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import express from 'express';
import { generateAccessToken } from '../utils/token.utils';
import jwt from 'jsonwebtoken';
import moment from 'moment';

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
  _req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  // req.auth = {
  //   continueOnFail: true,
  // };
  next();
};

// TODO: Remove auto token refresh.
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

  // if (!accessToken || !refreshToken) {
  //   if (req.auth && req.auth.continueOnFail) {
  //     return next();
  //   } else {
  //     return res.status(401).send('Unauthorized: Missing token.');
  //   }
  // }

  try {
    const decodedAccessToken = jwt.verify(accessToken, config.JWT_SECRET) as DecodedAccessToken;

    if (typeof decodedAccessToken !== 'object')
      return res.status(401).send('Unauthorized: Invalid jwt payload.');

    const user = await User.findById(decodedAccessToken.sub);

    if (!user) return res.status(401).send('Unauthorized: Invalid user.');

    req.user = user;

    next();
  } catch (error) {
    try {
      const decodedAccessToken = jwt.verify(accessToken, config.JWT_SECRET, {
        ignoreExpiration: true,
      }) as DecodedAccessToken;

      if (typeof decodedAccessToken !== 'object')
        return res.status(401).send('Unauthorized: Invalid jwt payload');

      const decodedRefreshToken = jwt.verify(refreshToken, config.JWT_SECRET) as {
        tokenId: string;
        token: string;
      };

      if (typeof decodedRefreshToken !== 'object')
        return res.status(401).send('Unauthorized: Invalid jwt payload');

      const user = await User.findById(decodedAccessToken.sub);

      if (user) req.user = user;

      const refreshTokenQuery = await Token.findById(decodedRefreshToken.tokenId);

      if (!refreshTokenQuery) return res.status(401).send('Unauthorized: Refresh token');

      // TODO: This is temporary fix, handle multiple refresh token request in axios.
      if (moment().diff(refreshTokenQuery.updatedAt) <= 30000) return next();

      const [newAccessToken, newRefreshToken] = await generateAccessToken(
        decodedAccessToken.sub,
        refreshToken
      );

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
