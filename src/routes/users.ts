import { body, param, query } from 'express-validator';

import UserController from '../controllers/UserController';
import authenticate from '../middleware/authenticate';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';
import passport from 'passport';

const router = express.Router();

/**
 * POST:PUBLIC {apiPrefix}/users User Registration Route
 */
router.post(
  '/',
  [
    body('firstName', 'First name is required').exists({ checkFalsy: true }),
    body('lastName')
      .optional()
      .notEmpty()
      .bail()
      .isAlpha('en-US', { ignore: [' ', '-'] })
      .withMessage('Must be type of string'),
    body('email')
      .exists({ checkFalsy: true })
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Not a valid email'),
    body('password')
      .exists({ checkFalsy: true })
      .withMessage('Password is required')
      .bail()
      .isLength({
        min: 6,
      })
      .withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .exists()
      .withMessage('Password confirmation is required')
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    checkValidationResult,
  ],
  UserController.RegisterUser
);

/**
 * GET:PRIVATE {apiPrefix}/users/me
 */
router.get('/me', passport.authenticate('jwt', { session: false }), UserController.GetCurrentUser);

/**
 * GET:PRIVATE {apiPrefix}/users/search?email=
 */
router.get(
  '/search',
  authenticate,
  [query('email').exists({ checkFalsy: true }), checkValidationResult],
  UserController.GetUserByPrimaryEmail
);

/**
 * PATCH:PRIVATE {apiPrefix}/users/me
 */
router.patch(
  '/me',
  authenticate,
  [
    body('firstName')
      .optional()
      .notEmpty()
      .bail()
      .isAlpha('en-US', { ignore: [' ', '-'] })
      .withMessage('Must be type of string'),
    body('lastName')
      .optional()
      .notEmpty()
      .bail()
      .isAlpha('en-US', { ignore: [' ', '-'] })
      .withMessage('Must be type of string'),
    body('profile').optional(),
    checkValidationResult,
  ],
  UserController.UpdateUser
);

/**
 * GET:PRIVATE {apiPrefix}/users/1
 */
router.get(
  '/:userId',
  authenticate,
  [param('userId').isMongoId().withMessage('Invalid User Id'), checkValidationResult],
  UserController.GetUser
);

/**
 * DELETE:PRIVATE {apiPrefix}/users/me
 */
router.delete('/me', (_req, res) => res.send('delete current user'));

export default router;
