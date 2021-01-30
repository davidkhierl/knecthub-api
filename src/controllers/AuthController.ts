import axios from 'axios';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import express from 'express';
import _ from 'lodash';
import * as queryString from 'query-string';

import config from '../config';
import { responseErrors, setResponseCookies } from '../helpers/response.helpers';
import { generateAccessToken } from '../utils/token.utils';
import { User } from '../models';
import Token from '../models/Token';

// Auth User
export const AuthUser = (req: express.Request, res: express.Response) => {
  return res.status(200).json(_.omit(req.user, ['id', 'password']));
};

/* -------------------------------------------------------------------------- */
/*                                 Login User                                 */
/* -------------------------------------------------------------------------- */

async function Login(req: express.Request, res: express.Response) {
  try {
    const { redirectUrl } = req.query;

    const { email, password } = <{ email: string; password: string }>req.body;

    const user = await User.findOne({
      emails: { $elemMatch: { email, type: 'primary' } },
    }).populate('profile');

    if (!user) return res.status(404).send(responseErrors([{ message: 'User does not exist' }]));

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).send(responseErrors([{ message: 'Invalid login details' }]));

    // generate access and refresh token
    const { accessToken, refreshToken } = await user.createAccessToken();

    return res
      .cookie('accessToken', accessToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .cookie('refreshToken', refreshToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .send(redirectUrl ? { redirectUrl, user } : user);
  } catch (error) {
    console.error('LOGIN ERROR', error.message);
    return res.status(500).send('Server error 🔴');
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Logout User                                */
/* -------------------------------------------------------------------------- */

async function Logout(req: express.Request, res: express.Response) {
  const { redirectUrl } = req.query;

  try {
    await Token.findOneAndDelete({ token: req.cookies['refreshToken'], type: 'refresh_token' });

    // TODO: think of better standard response.
    return redirectUrl
      ? res.clearCookie('accessToken').clearCookie('refreshToken').send({ redirectUrl })
      : res.clearCookie('accessToken').clearCookie('refreshToken').send('Logout success!');
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server error 🔴');
  }
}

// Authenticate and Register via LinkedIn
export const AuthLinkedIn = async (req: express.Request, res: express.Response) => {
  const { code, callbackUrl } = req.body;
  const requestBody = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: callbackUrl,
    client_id: config.LINKEDIN_KEY,
    client_secret: config.LINKEDIN_SECRET,
  };

  try {
    const getUserLinkedAccessToken = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      queryString.stringify(requestBody),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const userLinkedInData = await Promise.all([
      axios.get(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            Authorization: `Bearer ${getUserLinkedAccessToken.data.access_token}`,
          },
        }
      ),
      axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${getUserLinkedAccessToken.data.access_token}`,
        },
      }),
    ]).then((results) => {
      return {
        email: results[0].data.elements[0]['handle~'].emailAddress,
        firstName: results[1].data.localizedFirstName,
        lastName: results[1].data.localizedLastName,
        linkedInId: results[1].data.id,
      };
    });

    const { email, firstName, lastName, linkedInId } = userLinkedInData;

    // check if email is already registered
    let user = await User.findOne({ email });

    // register user
    if (!user) {
      // const profilePicture = await axios.get(
      //   'https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))',
      //   {
      //     headers: {
      //       Authorization: `Bearer ${getUserLinkedAccessToken.data.access_token}`,
      //     },
      //   }
      // );
      user = new User({
        firstName,
        lastName,
        email,
        linkedInId,
        isVerified: true,
      });

      // generate default password
      const salt = await bcrypt.genSalt(10);
      const password = CryptoJS.lib.WordArray.random(32);
      user.password = await bcrypt.hash(password.toString(), salt);
      await user.save();

      // creating and initialize user profile
      // await Profile.create({
      //   user: user.id,
      //   profilePicture: profilePicture.data.profilePicture['displayImage~'].elements.pop()
      //     .identifiers[0].identifier,
      // });

      const [accessToken, refreshToken] = await generateAccessToken(user.id);

      setResponseCookies(
        {
          cookies: [
            { name: 'accessToken', value: accessToken },
            { name: 'refreshToken', value: refreshToken },
          ],
          options: { httpOnly: true, expires: config.COOKIE_EXPIRATION },
        },
        res
      );

      user = await User.findOne({ email, linkedInId }).select('-password');

      return res.json(user);
    } else {
      // Sign in using linkedIn

      // attach linkedIn id
      if (user && !user.linkedInId) {
        user.linkedInId = linkedInId;
        user.isVerified = true;
        await user.save();
      }

      user = await User.findOne({ email, linkedInId });

      if (!user) throw { message: 'User not found' };

      const [accessToken, refreshToken] = await generateAccessToken(user.id);

      setResponseCookies(
        {
          cookies: [
            { name: 'accessToken', value: accessToken },
            { name: 'refreshToken', value: refreshToken },
          ],
          options: { httpOnly: true, expires: config.COOKIE_EXPIRATION },
        },
        res
      );

      user = await User.findOne({ email, linkedInId }).select('-password');

      return res.json(user);
    }
  } catch (error) {
    if (error.response) {
      return res.status(400).json(error.response.data);
    } else {
      console.log(error.message);
      return res.status(400).json(error.message);
    }
  }
};

export default { Login, Logout };
