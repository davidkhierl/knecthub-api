import { User } from '../models';
import express from 'express';

/* -------------------------------------------------------------------------- */
/*                          Get Current User Profile                          */
/* -------------------------------------------------------------------------- */

async function GetCurrentUserProfile(req: express.Request, res: express.Response) {
  try {
    const user = await User.findById(req.user.id).populate('profile');

    return res.send(user?.profile);
  } catch (error) {
    // return server error.
    return res.status(500).send(error.message);
  }
}

export default { GetCurrentUserProfile };
