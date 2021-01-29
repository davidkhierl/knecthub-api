import { Profile, User } from '../models';
import { resourceLocation, responseErrors } from '../helpers/response.helpers';

import bcrypt from 'bcryptjs';
import config from '../config';
import dayjs from 'dayjs';
import { encryptToken } from '../utils/token.utils';
import express from 'express';
import jwt from 'jsonwebtoken';
import mail from '../services/mail';
import { pick } from 'lodash';
import randomColor from 'randomcolor';

/* -------------------------------------------------------------------------- */
/*                                Get All Users                               */
/* -------------------------------------------------------------------------- */
async function GetUsers(_req: express.Request, res: express.Response) {
  await User.find({}, (err, users) => {
    if (err) return res.status(500).send(err);

    return res.send(users);
  });
}

/* -------------------------------------------------------------------------- */
/*                                  Get User                                  */
/* -------------------------------------------------------------------------- */
async function GetUser(req: express.Request, res: express.Response) {
  try {
    // find user.
    const user = await User.findById(req.params.userId);
    if (user) {
      return res.send(user);
    } else {
      return res.status(400).send(
        responseErrors([
          {
            message: 'User not found',
            location: 'params',
            param: 'id',
            value: req.params.userId,
          },
        ])
      );
    }
  } catch (error) {
    if (error.kind === 'ObjectId')
      return res.status(400).send(
        responseErrors([
          {
            message: 'Invalid User Id',
            location: 'params',
            param: 'id',
            value: req.params.userId,
          },
        ])
      );
    return res.status(500).send(error);
  }
}

/* -------------------------------------------------------------------------- */
/*                                Register User                               */
/* -------------------------------------------------------------------------- */
async function RegisterUser(req: express.Request, res: express.Response) {
  try {
    const { firstName, lastName, company, email, password } = req.body;

    // check if email is already registered
    const user = await User.findOne({ email });

    // return if user with the same email is already in use.
    if (user)
      return res
        .status(400)
        .send(
          responseErrors([{ message: 'Email already in use', param: 'email', location: 'body' }])
        );

    // create user profile first
    const profile = await Profile.create({
      company,
      avatarBgColor: randomColor({ luminosity: 'light', seed: `${firstName} ${lastName}` }),
    });

    // proceed creating user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
      profile: profile.id,
    });

    // populate user profile
    await newUser.populate('profile').execPopulate();

    // await newUser.populate('profile').execPopulate()
    // generate email verification token
    const token = await newUser.createEmailVerificationToken(dayjs().add(72, 'hour').toDate());

    const hash = encryptToken(token);

    const signedToken = jwt.sign(hash, config.JWT_PASSWORD_RESET_SECRET);

    const emailVerificationLink = encodeURI(
      `${config.CLIENT_URL}/email/verify?token=${signedToken}`
    );

    // Send email verification to email
    // TODO: Create email template in SendGrid.
    // TODO: Pass in the encrypted email token.
    await mail.send({
      to: email,
      from: config.SUPPORT_MAIL,
      subject: 'Email Verification',
      text: `Please visit this link to verify your email ${emailVerificationLink}`,
    });

    // generate access and refresh token
    const { accessToken, refreshToken } = await newUser.createAccessToken();

    return res
      .location(resourceLocation(req, newUser.id))
      .cookie('accessToken', accessToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .cookie('refreshToken', refreshToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .send(newUser);
  } catch (error) {
    // return server error.
    return res.status(500).send(error.message);
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Update User                                */
/* -------------------------------------------------------------------------- */
async function UpdateUser(req: express.Request, res: express.Response) {
  try {
    // only the first name and the last name are allowed to be updated
    // from this endpoint. Profile, Email and password will be controlled
    // from their own route: ProfileController, EmailController and
    // PasswordController.
    const user = await User.findByIdAndUpdate(
      req.user.id,
      pick(req.body, ['firstName', 'lastName']),
      { new: true }
    );

    // return if user doesn't exist.
    if (!user)
      return res.status(400).send(
        responseErrors([
          {
            message: 'User not found',
            location: 'params',
            param: 'id',
            value: req.params.userId,
          },
        ])
      );

    // return updated document.
    return res.location(resourceLocation(req)).send(user);
  } catch (error) {
    // return server error.
    return res.status(500).send(error.message);
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Delete User                                */
/* -------------------------------------------------------------------------- */

async function DeleteUser(req: express.Request, res: express.Response) {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user)
      return res.status(400).send(
        responseErrors([
          {
            message: 'User not found',
            location: 'params',
            param: 'id',
            value: req.params.userId,
          },
        ])
      );

    return res.status(204).end();
  } catch (error) {
    // return server error.
    return res.status(500).send(error.message);
  }
}

/* -------------------------------------------------------------------------- */
/*                              Get Current User                              */
/* -------------------------------------------------------------------------- */

async function GetCurrentUser(req: express.Request, res: express.Response) {
  try {
    const user = await User.findById(req.user.id).populate('profile');

    return res.send(user);
  } catch (error) {
    // return server error.
    return res.status(500).send(error.message);
  }
}
export default { GetUsers, GetUser, RegisterUser, UpdateUser, DeleteUser, GetCurrentUser };
