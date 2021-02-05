import { StandardResponse } from '../typings/express';
import Token from '../models/Token';
import config from '../config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

const verifyToken = async (
  req: express.Request,
  res: express.Response<StandardResponse>,
  next: express.NextFunction
) => {
  // TODO: REFACTOR. use checkValidationResult middleware.
  const errors = validationResult(req);
  // return validation errors
  if (!errors.isEmpty())
    return res
      .status(400)
      .send({ message: 'Validation failed.', success: false, errors: errors.array() });

  const { resetToken } = req.body;

  try {
    const verifyResetToken = await Token.findOne({ token: resetToken });

    if (!verifyResetToken || verifyResetToken.consumed === true)
      return res.status(400).send({ message: 'Request expired or invalid', success: false });

    jwt.verify(resetToken, config.JWT_PASSWORD_RESET_SECRET);

    return next();
  } catch (error) {
    console.error(error.message);

    return res.status(400).json({ message: 'Token expired or invalid', success: false });
  }
};

export default verifyToken;
