import express from 'express';
import { responseErrors } from '../helpers/response.helpers';

const isEmailVerified = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.user.isVerified === false)
    return res.status(400).json(responseErrors([{ message: 'Email not yet verified' }]));

  return next();
};

export default isEmailVerified;
