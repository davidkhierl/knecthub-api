import { IProfile } from '../models/Profile/profile.types';
import { StandardResponse } from '../typings/express';
import { User } from '../models';
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

export default { GetCurrentUserProfile };
