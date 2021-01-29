import {
  TokenHash,
  decryptToken,
  encryptToken,
  generateAccessToken,
  verifyToken,
} from '../utils/token.utils';

import Token from '../models/Token';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import config from '../config';
import dayjs from 'dayjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import mail from '../services/mail';
import { responseErrors } from '../helpers/response.helpers';
import { validationResult } from 'express-validator';

/* -------------------------------------------------------------------------- */
/*                           Password Reset Request                           */
/* -------------------------------------------------------------------------- */

async function RequestResetLink(req: express.Request, res: express.Response) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const token = await user.createPasswordResetToken();

      const hash = encryptToken(token);

      const signedToken = jwt.sign(hash, config.JWT_PASSWORD_RESET_SECRET);

      const resetLink = encodeURI(`${config.CLIENT_URL}/password/reset?token=${signedToken}`);

      await mail.send({
        to: email,
        from: config.SUPPORT_MAIL,
        subject: 'Knecthub password reset request',
        text: `A request has been received to change the password for your Knecthub account. please click the link to proceed ${resetLink}`,
      });
    }

    // TODO: think of better standard response.
    return res.send({
      message: 'Check your email.',
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server error 🔴');
  }
}

/* -------------------------------------------------------------------------- */
/*                         Verify Password Reset Token                        */
/* -------------------------------------------------------------------------- */

async function VerifyResetToken(req: express.Request, res: express.Response) {
  try {
    const token = req.query.token as string;

    const hash = jwt.verify(token, config.JWT_PASSWORD_RESET_SECRET) as TokenHash;

    const resetToken = decryptToken(hash);

    const isValidResetToken = await verifyToken(resetToken, 'password_reset');

    if (!isValidResetToken) return res.status(400).send('Invalid token');

    return res.send('Valid token');
  } catch (error) {
    console.error(error.message);

    return res.status(500).send('Server error');
  }
}

/* -------------------------------------------------------------------------- */
/*                               Reset Password                               */
/* -------------------------------------------------------------------------- */

const ResetPassword = async (req: express.Request, res: express.Response) => {
  try {
    const { password } = req.body;

    const token = req.query.token as string;

    const hash = jwt.verify(token, config.JWT_PASSWORD_RESET_SECRET) as TokenHash;

    const resetToken = decryptToken(hash);

    const tokenQuery = await Token.findOne({
      token: resetToken,
      type: 'password_reset',
      consumed: false,
      invalidated: false,
    }).populate('user');

    if (!tokenQuery || dayjs().isAfter(dayjs(tokenQuery.expiresIn)))
      return res.status(400).send(responseErrors([{ message: 'Request expired or invalid' }]));

    if (dayjs().isAfter(dayjs(tokenQuery.expiresIn))) return false;

    //  generate password salt
    const salt = await bcrypt.genSalt(10);

    // hash user password
    const newPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(tokenQuery.user.id, {
      password: newPassword,
    });

    tokenQuery.consumed = true;

    tokenQuery.consumedAt = new Date();

    await tokenQuery.save();

    const [accessToken, refreshToken] = await generateAccessToken(tokenQuery.user.id);

    return res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        expires: config.COOKIE_EXPIRATION,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        expires: config.COOKIE_EXPIRATION,
      })
      .send(tokenQuery.user);
  } catch (error) {
    console.error(error.message);

    if (error.message === 'jwt malformed')
      return res
        .status(400)
        .send(responseErrors([{ message: 'Invalid token', location: 'query', param: 'token' }]));

    return res.status(500).send('Server error 🔴');
  }
};

// Change password
// TODO: REFACTOR
export const PasswordChange = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  // return validation errors
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json(responseErrors([{ message: 'User not found' }]));

    const passwordMatched = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatched)
      return res.status(400).json(responseErrors([{ message: 'Incorrect password' }]));

    // generate password salt
    const salt = await bcrypt.genSalt(10);

    // hash user password
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server error 🔴');
  }
};

export default { RequestResetLink, VerifyResetToken, ResetPassword };
