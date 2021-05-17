import authenticate from '../middleware/authenticate';
import { body } from 'express-validator';
import express from 'express';

const router = express.Router();

/**
 * GET:PRIVATE {apiPrefix}/profiles/me
 */
router.get('/me', authenticate);

/**
 * PATCH:PRIVATE {apiPrefix}/profiles/me
 */
router.patch('/me', authenticate, [
  body('bio')
    .optional()
    .notEmpty()
    .bail()
    .isAlpha('en-US', { ignore: [' ', '-'] })
    .withMessage('Must be type of string'),
  body('company')
    .optional()
    .notEmpty()
    .bail()
    .isAlpha('en-US', { ignore: [' ', '-'] })
    .withMessage('Must be type of string'),
  body('contactNumber')
    .optional()
    .notEmpty()
    .bail()
    .isAlpha('en-US', { ignore: [' ', '-'] })
    .withMessage('Must be type of string'),
  body('jobTitle')
    .optional()
    .notEmpty()
    .bail()
    .isAlpha('en-US', { ignore: [' ', '-'] })
    .withMessage('Must be type of string'),
  body('location')
    .optional()
    .notEmpty()
    .bail()
    .isAlpha('en-US', { ignore: [' ', '-'] })
    .withMessage('Must be type of string'),
]);
export default router;
