import axios from 'axios';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import express from 'express';
import * as queryString from 'query-string';
import jwt from 'jsonwebtoken';
import config from '../config';
import { setResponseCookies } from '../helpers/response.helpers';
import { generateAccessToken } from '../utils/token.utils';
import { User } from '../models';
import Token from '../models/Token';
import { IUser } from '../models/User/user.types';
import { ParamsDictionary, StandardResponse } from '../typings/express';

/* -------------------------------------------------------------------------- */
/*                                 Login User                                 */
/* -------------------------------------------------------------------------- */

async function Login(
  req: express.Request<ParamsDictionary, any, any, { redirectUrl: string }>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    const { redirectUrl } = req.query as { redirectUrl: string };

    const { email, password } = <{ email: string; password: string }>req.body;

    const user = await User.findOne({
      emails: { $elemMatch: { email, type: 'primary' } },
    }).populate('profile');

    if (!user) return res.status(404).send({ message: 'User not found', success: false });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).send({ message: 'Invalid login details', success: false });

    const { accessToken, refreshToken } = await user.createAccessToken();

    return res
      .cookie('accessToken', accessToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .cookie('refreshToken', refreshToken, { httpOnly: true, expires: config.COOKIE_EXPIRATION })
      .send({ data: user, message: 'User logged in.', redirectUrl, success: true });
  } catch (error) {
    console.error('LOGIN ERROR', error.message);

    return res.status(500).send({ message: 'Server error', success: false });
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Logout User                                */
/* -------------------------------------------------------------------------- */

async function Logout(
  req: express.Request<ParamsDictionary, any, any, { redirectUrl: string }>,
  res: express.Response<StandardResponse>
) {
  try {
    const { redirectUrl } = req.query;

    const { token } = jwt.verify(req.cookies['refreshToken'], config.JWT_SECRET, {
      ignoreExpiration: true,
    }) as {
      tokenId: string;
      token: string;
    };

    await Token.findOneAndDelete({ token, type: 'refresh_token' });

    return res
      .clearCookie('accessToken')
      .clearCookie('refreshToken')
      .send({ message: 'User logged out.', success: true, redirectUrl });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
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
