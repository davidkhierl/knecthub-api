import { ParamsDictionary, StandardResponse } from '../typings/express';
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

/* -------------------------------------------------------------------------- */
/*                           Password Reset Request                           */
/* -------------------------------------------------------------------------- */

async function RequestResetLink(
  req: express.Request<ParamsDictionary, any, { email: string }>,
  res: express.Response<StandardResponse>
) {
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

    return res.send({
      message:
        'Email verification sent to your email, please click the link provided inside to complete the request.',
      success: true,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

/* -------------------------------------------------------------------------- */
/*                         Verify Password Reset Token                        */
/* -------------------------------------------------------------------------- */

async function VerifyResetToken(
  req: express.Request<ParamsDictionary, any, any, { token: string }>,
  res: express.Response<StandardResponse>
) {
  try {
    const token = req.query.token;

    const hash = jwt.verify(token, config.JWT_PASSWORD_RESET_SECRET) as TokenHash;

    const resetToken = decryptToken(hash);

    const isValidResetToken = await verifyToken(resetToken, 'password_reset');

    if (!isValidResetToken)
      return res.status(400).send({
        message: 'Invalid token.',
        success: false,
        errors: [{ location: 'query', message: 'Invalid token.', param: 'token', value: token }],
      });

    return res.send({ message: 'Password reset token valid.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

/* -------------------------------------------------------------------------- */
/*                               Reset Password                               */
/* -------------------------------------------------------------------------- */

const ResetPassword = async (
  req: express.Request<ParamsDictionary, any, { password: string }, { token: string }>,
  res: express.Response<StandardResponse>
) => {
  try {
    const { password } = req.body;

    const token = req.query.token;

    const hash = jwt.verify(token, config.JWT_PASSWORD_RESET_SECRET) as TokenHash;

    const resetToken = decryptToken(hash);

    const tokenQuery = await Token.findOne({
      token: resetToken,
      type: 'password_reset',
      consumed: false,
      invalidated: false,
    }).populate('user');

    if (!tokenQuery || dayjs().isAfter(dayjs(tokenQuery.expiresIn)))
      return res.status(400).send({
        message: 'Request expired or invalid.',
        success: false,
        errors: [
          {
            location: 'query',
            message: 'Token expired or invalid.',
            param: 'token',
            value: token,
          },
        ],
      });

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
      return res.status(400).send({
        message: 'Invalid token.',
        success: false,
        errors: [{ location: 'query', message: 'Invalid token.', param: 'token' }],
      });

    return res.status(500).send({ message: 'Server error.', success: false });
  }
};

// Change password
async function ChangePassword(
  req: express.Request<ParamsDictionary, any, { currentPassword: string; newPassword: string }>,
  res: express.Response<StandardResponse>
) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).send({ message: 'User not found', success: false });

    const passwordMatched = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatched)
      return res.status(400).send({
        message: 'Incorrect password',
        success: false,
        errors: [
          {
            location: 'body',
            message: 'Incorrect password.',
            param: 'currentPassword',
            value: currentPassword,
          },
        ],
      });

    // generate password salt
    const salt = await bcrypt.genSalt(10);

    // hash user password
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.send({ message: 'Password changed', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

export default { RequestResetLink, VerifyResetToken, ResetPassword, ChangePassword };
