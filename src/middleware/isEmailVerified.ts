import { StandardResponse } from '../typings/express';
import express from 'express';

const isEmailVerified = async (
  _req: express.Request,
  _res: express.Response<StandardResponse>,
  next: express.NextFunction
) => {
  // TODO: Refactor
  // if (req.user.isVerified === false)
  //   return res.status(400).json({ message: 'Email not yet verified', success: false });

  return next();
};

export default isEmailVerified;
