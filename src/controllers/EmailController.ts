import { TokenHash, decryptToken } from '../utils/token.utils';

import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import dayjs from 'dayjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { responseErrors } from '../helpers/response.helpers';

// Verify user email
const VerifyEmail = async (req: express.Request, res: express.Response) => {
  try {
    const { token, email } = req.query as { token: string; email: string };

    const hash = jwt.verify(token, config.JWT_PASSWORD_RESET_SECRET) as TokenHash;

    const emailVerificationToken = decryptToken(hash);

    const tokenQuery = await Token.findOne({
      token: emailVerificationToken,
      type: 'email_verification',
    });

    // Verify token
    if (!tokenQuery) return res.status(400).json(responseErrors({ message: 'Invalid Token' }));

    // check if token expired
    if (dayjs().isAfter(dayjs(tokenQuery.expiresIn)))
      return res.status(400).json(responseErrors({ message: 'Token Expired' }));

    // update user email to verified
    const userQuery = await User.findById(tokenQuery.user);

    if (!userQuery) return res.status(404).json(responseErrors({ message: 'User not found' }));

    if (userQuery.isVerified)
      return res.status(400).json(responseErrors({ message: 'Already verified' }));

    userQuery.isVerified = true;

    await userQuery.save();

    await User.updateOne(
      { _id: tokenQuery.user, 'emails.email': email },
      { $set: { 'emails.$.confirmed': true } }
    );

    tokenQuery.consumed = true;

    tokenQuery.consumedAt = new Date();

    await tokenQuery.save();

    return res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    console.error(error.message);

    if (error.message === 'jwt malformed')
      return res
        .status(400)
        .send(responseErrors([{ message: 'Invalid token', location: 'query', param: 'token' }]));

    return res.status(500).send('Server error');
  }
};

export default { VerifyEmail };
