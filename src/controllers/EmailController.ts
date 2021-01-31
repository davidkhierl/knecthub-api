import { TokenHash, decryptToken, encryptToken } from '../utils/token.utils';

import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import dayjs from 'dayjs';
import express from 'express';
import { find } from 'lodash';
import jwt from 'jsonwebtoken';
import { responseErrors } from '../helpers/response.helpers';

// Verify user email
async function VerifyEmail(req: express.Request, res: express.Response) {
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
        .send(responseErrors({ message: 'Invalid token', location: 'query', param: 'token' }));

    return res.status(500).send('Server error');
  }
}

// Update primary email
async function UpdatePrimaryEmail(req: express.Request, res: express.Response) {
  try {
    const { email } = req.body as { email: string };

    const emailQuery = await User.findOne({
      _id: req.user.id,
      emails: { $elemMatch: { email, type: 'pendingPrimary' } },
    });

    console.log(emailQuery?.emails);

    if (find(emailQuery?.emails, { email, type: 'primary' }))
      return res.status(400).send({ message: `${email} is already the primary email.` });

    console.log(find(emailQuery?.emails, { email, type: 'primary' }));
    if (emailQuery)
      return res.status(400).send({
        message: 'Email already have a pending confirmation.',
      });

    const userQuery = await User.findById(req.user.id);

    if (!userQuery) return res.status(400).send('Invalid user.');

    userQuery.emails.push({ email, type: 'pendingPrimary', confirmed: false, isVisible: false });

    const token = await userQuery.createToken(
      'email_verification',
      dayjs().add(1, 'month').toDate()
    );

    const hash = encryptToken(token);

    const signedToken = jwt.sign(hash, 'ADD-A-SECRET-HERE');

    const emailVerificationLink = encodeURI(
      `${config.CLIENT_URL}/email/verify?token=${signedToken}&email=${encodeURI(
        email
      )}&type=primary`
    );

    console.log(emailVerificationLink);

    // TODO: WORK IN PROGRESS
    // const confirmToken = await Token.create({user: req.user.id, })

    // const token = userQuery.createEmailVerificationToken(dayjs().add(72, 'hour').toDate());

    await userQuery.save();

    return res.status(200).send({ message: 'Confirm your email to complete the changes.' });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send('Server error');
  }
}

export default { VerifyEmail, UpdatePrimaryEmail };
