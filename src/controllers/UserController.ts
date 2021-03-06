import { AuthSuccessResponse, ParamsDictionary, StandardResponse } from '../typings/express';
import { Profile, User } from '../models';
import { pick, startCase } from 'lodash';

import { IUser } from '../models/User/user.types';
import bcrypt from 'bcryptjs';
import config from '../config';
import dayjs from 'dayjs';
import { encryptToken } from '../utils/token.utils';
import express from 'express';
import jwt from 'jsonwebtoken';
import mail from '../services/mail';
import randomColor from 'randomcolor';
import { resourceLocation } from '../helpers/response.helpers';

/* -------------------------------------------------------------------------- */
/*                                Get All Users                               */
/* -------------------------------------------------------------------------- */
async function GetUsers(_req: express.Request, res: express.Response<StandardResponse<IUser[]>>) {
  await User.find({}, (err, users) => {
    if (err) return res.status(500).send({ message: err, success: false });

    return res.send({ message: 'All users.', success: true, data: users });
  });
}

/* -------------------------------------------------------------------------- */
/*                                  Get User                                  */
/* -------------------------------------------------------------------------- */
async function GetUser(req: express.Request, res: express.Response<StandardResponse<IUser>>) {
  try {
    const user = await User.findById(req.params.userId);

    if (!user)
      return res.status(400).send({
        message: 'User not found',
        success: false,
        errors: [
          {
            location: 'params',
            message: 'User not found',
            param: 'userId',
            value: req.params.userId,
          },
        ],
      });

    return res.send({ data: user, message: '', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error', success: false });
  }
}

/* -------------------------------------------------------------------------- */
/*                              Get User By Email                             */
/* -------------------------------------------------------------------------- */
async function GetUserByPrimaryEmail(
  req: express.Request<ParamsDictionary, any, any, { email: string }>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    const { email } = req.query;

    const user = await User.findByEmail(email);

    if (!user)
      return res.status(400).send({
        message: 'User not found.',
        success: false,
        errors: [
          {
            location: 'query',
            message: 'User with this email does not exist.',
            param: 'email',
            value: email,
          },
        ],
      });

    return res.send({ data: user, message: 'User found.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

// Register user.
async function RegisterUser(
  req: express.Request<
    ParamsDictionary,
    any,
    { firstName: string; lastName?: string; company?: string; email: string; password: string }
  >,
  res: express.Response<StandardResponse<AuthSuccessResponse>>
) {
  try {
    const { firstName, lastName, company, email, password } = req.body;

    // check if email is already registered
    const userQuery = await User.findOne({ email });

    // return if user with the same email is already in use.
    if (userQuery)
      return res.status(400).send({
        message: 'Email already in use.',
        success: false,
        errors: [
          { location: 'body', message: 'Email already in use.', param: 'email', value: email },
        ],
      });

    // create user profile first
    const profile = await Profile.create({
      company,
      avatarBgColor: randomColor({ luminosity: 'light', seed: `${firstName} ${lastName}` }),
    });

    // proceed creating user
    const user = await User.create({
      firstName: startCase(firstName),
      lastName: startCase(lastName),
      email,
      password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
      profile,
    });

    // populate user profile
    await user.populate('profile').execPopulate();

    // generate email verification token
    const token = await user.createEmailVerificationToken(dayjs().add(72, 'hour').toDate());

    // encrypt token
    const hash = encryptToken(token);

    // sign jwt token
    const signedToken = jwt.sign(
      { sub: user.id, hash, email },
      config.JWT_EMAIL_VERIFICATION_SECRET
    );

    // email verification link
    const emailVerificationLink = encodeURI(
      `${config.CLIENT_URL}/email/verify?token=${signedToken}`
    );

    // Send email verification to email
    await mail.send(
      {
        to: email,
        from: config.SUPPORT_MAIL,
        templateId: 'd-e1974dd64a9e472dbbabc8b05c7fe167',
        dynamicTemplateData: {
          firstName: startCase(firstName),
          emailVerificationLink,
        },
      },
      false,
      (error: any, _result) => {
        if (error) console.error(error.response.body.errors);
      }
    );

    // generate access and refresh token
    const { accessToken, refreshToken } = await user.createAccessToken();

    return res
      .location(resourceLocation(req, user.id))
      .cookie('accessToken', accessToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .cookie('refreshToken', refreshToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .send({
        data: { user, accessToken, refreshToken },
        message: 'Register success',
        success: true,
      });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Update User                                */
/* -------------------------------------------------------------------------- */
async function UpdateUser(
  req: express.Request<ParamsDictionary, any, { firstName: string; lastName: string }>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    // only the first name and the last name are allowed to be updated
    // from this endpoint. Profile, Email and password will be controlled
    // from their own route: ProfileController, EmailController and
    // PasswordController.
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      pick(req.body, ['firstName', 'lastName']),
      { new: true }
    ).populate('profile');

    // return if user doesn't exist.
    if (!user)
      return res.status(400).send({
        message: 'User not found.',
        success: false,
        errors: [
          {
            message: 'User not found',
            location: 'params',
            param: 'id',
            value: req.params.userId,
          },
        ],
      });

    // return updated document.
    return res
      .location(resourceLocation(req))
      .send({ data: user, message: 'User updated.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Delete User                                */
/* -------------------------------------------------------------------------- */

async function DeleteUser(req: express.Request, res: express.Response<StandardResponse>) {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user)
      return res.status(400).send({
        message: 'User not found.',
        success: false,
        errors: [
          {
            message: 'User not found.',
            location: 'params',
            param: 'id',
            value: req.params.userId,
          },
        ],
      });

    return res.status(204).end();
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

// Get current user
async function GetCurrentUser(
  req: express.Request,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    const user = await User.findById(req.user?.id).populate('profile');

    if (!user) res.status(400).send({ message: 'User not found.', success: false });

    return res.send({ data: user, message: 'Current user.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}
export default {
  GetUsers,
  GetUser,
  RegisterUser,
  UpdateUser,
  DeleteUser,
  GetCurrentUser,
  GetUserByPrimaryEmail,
};
