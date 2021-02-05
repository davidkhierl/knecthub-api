import { IUser, IUserEmails } from '../models/User/user.types';
import { ParamsDictionary, StandardResponse } from '../typings/express';
import { TokenHash, decryptToken, encryptToken } from '../utils/token.utils';
import { find, matches } from 'lodash';

import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import dayjs from 'dayjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import mail from '../services/mail';

// Verify user email
async function VerifyEmail(
  req: express.Request<ParamsDictionary, any, any, { token: string }>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    const { token } = req.query;

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
      return res.status(400).json({ message: 'Invalid Token', success: false });

    // check if token expired
    if (dayjs().isAfter(dayjs(tokenQuery.expiresIn)))
      return res.status(400).json({ message: 'Token Expired', success: false });

    // update user email to verified
    const userQuery = await User.findById(tokenQuery.user);

    if (!userQuery) return res.status(404).json({ message: 'User not found', success: false });

    if (userQuery.isVerified && type === 'primary')
      return res.status(400).json({ message: 'Already verified', success: false });

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

    // get the update user
    const user = await User.findById(tokenQuery.user).populate('profile');

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
  req: express.Request<ParamsDictionary, any, { email: string }>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    const { email } = req.body;

    const userQuery = await User.findById(req.user.id);

    if (!userQuery) return res.status(400).send({ message: 'Unauthorized.', success: false });

    if (find(userQuery?.emails, matches({ email, type: 'primary' })))
      return res.status(400).send({
        message: `${email} is already the primary email.`,
        success: false,
        errors: [
          {
            location: 'body',
            message: `Already the primary email.`,
            param: 'email',
            value: email,
          },
        ],
      });

    if (find(userQuery?.emails, matches({ email, type: 'pendingPrimary' })))
      return res.status(400).send({
        message: `${email} already have a pending confirmation.`,
        success: false,
        errors: [
          {
            location: 'body',
            message: 'Already have a pending confirmation.',
            param: 'email',
            value: email,
          },
        ],
      });

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

    // const user = (await userQuery.save()).populate('profile');

    await userQuery.save();

    // get the update user
    const user = await User.findById(req.user.id).populate('profile');

    await mail.send({
      to: email,
      from: config.SUPPORT_MAIL,
      subject: 'Email Verification',
      text: `Please visit this link to verify your email ${emailVerificationLink}`,
    });

    return res.status(200).send({
      message: 'Verification email has been sent, Confirm your email to complete the changes.',
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error', success: false });
  }
}

export default { VerifyEmail, UpdatePrimaryEmail };
