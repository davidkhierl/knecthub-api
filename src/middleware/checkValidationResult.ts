import { StandardResponse } from '../typings/express';
import express from 'express';
import { validationResult } from 'express-validator';

/**
 * A custom express-validator middleware to return errors if validation failed,
 * must be placed after validation chain.
 * @param req Express request
 * @param res Express response
 * @param next Express next
 */
function checkValidationResult(
  req: express.Request,
  res: express.Response<StandardResponse>,
  next: express.NextFunction
) {
  const validate = validationResult.withDefaults({
    formatter: (error) => ({
      message: error.msg,
      param: error.param,
      value: error.value,
      location: error.location,
      nestedErrors: error.nestedErrors,
    }),
  });

  const errors = validate(req);

  if (!errors.isEmpty())
    return res
      .status(400)
      .send({ message: 'Validation failed.', success: false, errors: errors.array() });

  return next();
}

export default checkValidationResult;
