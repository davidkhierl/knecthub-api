import { ParamsDictionary, StandardResponse } from '../typings/express';
import { Profile, User } from '../models';

import { IProfile } from '../models/Profile/profile.types';
import { IUser } from '../models/User/user.types';
import express from 'express';

/* -------------------------------------------------------------------------- */
/*                          Get Current User Profile                          */
/* -------------------------------------------------------------------------- */

async function GetCurrentUserProfile(
  req: express.Request,
  res: express.Response<StandardResponse<IProfile>>
) {
  try {
    const user = await User.findById(req.user.id).populate('profile');

    return res.send({ message: 'Current user profile.', success: true, data: user?.profile });
  } catch (error) {
    // return server error.
    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

async function UpdateProfile(
  req: express.Request<ParamsDictionary, any, IProfile>,
  res: express.Response<StandardResponse<IUser>>
) {
  try {
    await Profile.findByIdAndUpdate(req.user.profile, req.body);

    const user = await User.findById(req.user.id).populate('profile');

    return res.send({ data: user, message: 'Profile updated.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

export default { GetCurrentUserProfile, UpdateProfile };
