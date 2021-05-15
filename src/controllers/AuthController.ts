import { AuthSuccessResponse, ParamsDictionary, StandardResponse } from '../typings/express';

import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import express from 'express';
import { generateAccessToken } from '../utils/token.utils';
import jwt from 'jsonwebtoken';
import passport from 'passport';

// Sign In User
async function SignIn(
  req: express.Request<ParamsDictionary, any, any, { redirectUrl: string }>,
  res: express.Response<StandardResponse<AuthSuccessResponse>>,
  next: express.NextFunction
) {
  passport.authenticate('local', async function (error, user, info) {
    const { redirectUrl } = req.query as { redirectUrl: string };

    if (error) {
      console.error('LOGIN ERROR', error.message);

      return res.status(500).send({ message: 'Server error', success: false });
    }

    if (!user) return res.status(400).send({ message: info.message, success: false });

    const { accessToken, refreshToken } = await user.createAccessToken();

    return res
      .cookie('accessToken', accessToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .cookie('refreshToken', refreshToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .send({
        data: { user, accessToken, refreshToken },
        redirectUrl,
        message: 'Sign in success',
        success: true,
      });
  })(req, res, next);
}

// Logout User
async function SignOut(
  req: express.Request<ParamsDictionary, any, any, { redirectUrl: string }>,
  res: express.Response<StandardResponse>
) {
  try {
    const { redirectUrl } = req.query;

    const { token } = jwt.verify(req.cookies['refreshToken'], config.JWT_SECRET, {
      ignoreExpiration: true,
    }) as {
      tokenId: string;
      token: string;
    };

    await Token.findOneAndDelete({ token, type: 'refresh_token' });

    return res
      .clearCookie('accessToken')
      .clearCookie('refreshToken')
      .send({ message: 'User logged out.', success: true, redirectUrl });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

// Refresh access token
async function Refresh(
  req: express.Request<ParamsDictionary, any, any, { redirectUrl: string }>,
  res: express.Response<StandardResponse>
) {
  const { accessToken, refreshToken }: { accessToken: string; refreshToken: string } = req.cookies;
  try {
    const decodedAccessToken = jwt.verify(accessToken, config.JWT_SECRET, {
      ignoreExpiration: true,
    }) as {
      sub: string;
      name: string;
      admin?: boolean;
    };

    if (typeof decodedAccessToken !== 'object')
      return res
        .status(401)
        .send({ message: 'Unauthorized: Invalid jwt payload.', success: false });

    const [newAccessToken, newRefreshToken] = await generateAccessToken(
      decodedAccessToken.sub,
      refreshToken
    );

    return res
      .cookie('accessToken', newAccessToken, {
        httpOnly: true,
        expires: config.COOKIE_EXPIRATION,
      })
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        expires: config.COOKIE_EXPIRATION,
      })
      .send({ message: 'Access token refreshed.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

// Sign in with google success
async function SignInWithGoogleSuccess(
  req: express.Request<ParamsDictionary, any, any, { redirectUrl: string }>,
  res: express.Response<StandardResponse<AuthSuccessResponse>>
) {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) return res.redirect(`${config.CLIENT_URL}`);

    const { accessToken, refreshToken } = await user.createAccessToken();

    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        expires: config.COOKIE_EXPIRATION,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        expires: config.COOKIE_EXPIRATION,
      })
      .redirect(`${config.CLIENT_URL}/auth/redirect`);
  } catch (error) {
    console.error(error);

    res.redirect(`${config.CLIENT_URL}/auth/redirect`);
  }
}

export default { SignIn, SignOut, Refresh, SignInWithGoogleSuccess };
