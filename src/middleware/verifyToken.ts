import Token from '../models/Token';
import config from '../config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { responseErrors } from '../helpers/response.helpers';
import { validationResult } from 'express-validator';

const verifyToken = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // TODO: REFACTOR. use checkValidationResult middleware.
  const errors = validationResult(req);
  // return validation errors
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { resetToken } = req.body;

  try {
    const verifyResetToken = await Token.findOne({ token: resetToken });

    if (!verifyResetToken || verifyResetToken.consumed === true)
      return res.status(400).json(responseErrors([{ message: 'Request expired or invalid' }]));

    jwt.verify(resetToken, config.JWT_PASSWORD_RESET_SECRET);
    return next();
  } catch (error) {
    console.error(error.message);
    return res.status(400).json(responseErrors([{ message: 'Token expired or invalid' }]));
  }
};

export default verifyToken;
