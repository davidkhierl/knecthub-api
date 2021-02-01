import { TokenHash, decryptToken, encryptToken } from '../utils/token.utils';
import { find, matches } from 'lodash';

import { IUserEmails } from '../models/User/user.types';
import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import dayjs from 'dayjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import mail from '../services/mail';
import { responseErrors } from '../helpers/response.helpers';

// Verify user email
async function VerifyEmail(req: express.Request, res: express.Response) {
  try {
    const { token } = req.query as {
      token: string;
    };

    const { hash, email, type } = jwt.verify(token, config.JWT_EMAIL_VERIFICATION_SECRET) as {
      hash: TokenHash;
      email: string;
      type: IUserEmails['type'];
    };

    const emailVerificationToken = decryptToken(hash);

    const tokenQuery = await Token.findOne({
      token: emailVerificationToken,
      type: 'email_verification',
    });

    // Verify token
    if (!tokenQuery || tokenQuery.consumed)
      return res.status(400).json(responseErrors({ message: 'Invalid Token' }));

    // check if token expired
    if (dayjs().isAfter(dayjs(tokenQuery.expiresIn)))
      return res.status(400).json(responseErrors({ message: 'Token Expired' }));

    // update user email to verified
    const userQuery = await User.findById(tokenQuery.user);

    if (!userQuery) return res.status(404).json(responseErrors({ message: 'User not found' }));

    if (userQuery.isVerified && type === 'primary')
      return res.status(400).json(responseErrors({ message: 'Already verified' }));

    if (!userQuery.isVerified && type === 'primary') userQuery.isVerified = true;

    await userQuery.save();

    if (type === 'primary')
      await User.updateOne(
        { _id: tokenQuery.user, 'emails.email': email },
        { $set: { 'emails.$.confirmed': true } }
      );

    if (type === 'pendingPrimary') {
      await User.updateOne(
        { _id: tokenQuery.user, 'emails.type': 'primary' },
        { $set: { 'emails.$.email': email } }
      );

      await User.updateOne(
        { _id: tokenQuery.user, emails: { $elemMatch: { email, type: 'pendingPrimary' } } },
        { $pull: { emails: { email, type: 'pendingPrimary' } } }
      );
    }

    if (type === 'secondary')
      await User.updateOne(
        { _id: tokenQuery.user, emails: { $elemMatch: { email, type: 'secondary' } } },
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
        .send(responseErrors({ message: 'Invalid token', location: 'query', param: 'token' }));

    return res.status(500).send('Server error');
  }
}

// Update primary email
async function UpdatePrimaryEmail(req: express.Request, res: express.Response) {
  try {
    const { email } = req.body as { email: string };

    const userQuery = await User.findById(req.user.id);

    if (!userQuery) return res.status(400).send('Invalid user.');

    if (find(userQuery?.emails, matches({ email, type: 'primary' })))
      return res.status(400).send(
        responseErrors({
          location: 'body',
          message: `${email} is already the primary email.`,
          param: 'email',
          value: email,
        })
      );

    if (find(userQuery?.emails, matches({ email, type: 'pendingPrimary' })))
      return res.status(400).send(
        responseErrors({
          location: 'body',
          message: 'Email already have a pending confirmation.',
          param: 'email',
          value: email,
        })
      );

    userQuery.emails.push({ email, type: 'pendingPrimary', confirmed: false, isVisible: false });

    const token = await userQuery.createToken(
      'email_verification',
      dayjs().add(1, 'month').toDate()
    );

    const hash = encryptToken(token);

    const signedToken = jwt.sign(
      { hash, email, type: 'pendingPrimary' },
      config.JWT_EMAIL_VERIFICATION_SECRET
    );

    const emailVerificationLink = encodeURI(
      `${config.CLIENT_URL}/email/verify?token=${signedToken}`
    );

    await userQuery.save();

    await mail.send({
      to: email,
      from: config.SUPPORT_MAIL,
      subject: 'Email Verification',
      text: `Please visit this link to verify your email ${emailVerificationLink}`,
    });

    return res.status(200).send({
      message: 'Verification email has been sent, Confirm your email to complete the changes.',
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send('Server error');
  }
}

export default { VerifyEmail, UpdatePrimaryEmail };
