import { ParamsDictionary, StandardResponse } from '../typings/express';
import { TokenHash, decryptToken } from '../utils/token.utils';

import { IUser } from '../models/User/user.types';
import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import express from 'express';
import jwt from 'jsonwebtoken';

// Verify user email
async function VerifyEmail(
  req: express.Request<ParamsDictionary, any, any, { token: string }>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    const { token } = req.query;

    // verify jwt
    const { hash, email } = jwt.verify(token, config.JWT_EMAIL_VERIFICATION_SECRET) as {
      sub: string;
      hash: TokenHash;
      email: string;
    };

    // decrypt token
    const emailVerificationToken = decryptToken(hash);

    const tokenQuery = await Token.findOne({
      token: emailVerificationToken,
      type: 'email_verification',
    });

    // verify token validity
    if (!tokenQuery || !tokenQuery.isTokenValid())
      return res.status(400).json({ message: 'Invalid Token', success: false });

    // check if token expired
    // if (dayjs().isAfter(dayjs(tokenQuery.expiresIn)))
    //   return res.status(400).json({ message: 'Token Expired', success: false });

    const user = await User.findByEmailAndUpdate(
      email,
      { emailVerified: true },
      { new: true, populate: 'profile' }
    );

    await tokenQuery.consumeToken();

    return res.json({ success: true, message: 'Email verified', data: user });
  } catch (error) {
    console.error(error.message);

    if (error.message === 'jwt malformed')
      return res.status(400).send({
        message: 'Invalid token.',
        success: false,
        errors: [{ location: 'query', message: 'Invalid token.', param: 'token' }],
      });

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

// Update primary email
async function UpdatePrimaryEmail(
  _req: express.Request<ParamsDictionary, any, { email: string }>,
  _res: express.Response<StandardResponse<IUser>>
) {}

export default { VerifyEmail, UpdatePrimaryEmail };
