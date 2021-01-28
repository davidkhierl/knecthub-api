import PasswordController, { PasswordChange } from '../controllers/PasswordController';
import { body, check, query } from 'express-validator';

import authenticate from '../middleware/authenticate';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                   POST:PUBLIC {apiPrefix}/password/reset                   */
/* -------------------------------------------------------------------------- */

router.post(
  '/reset',
  [
    body('email', 'Not valid email').exists().withMessage('Email required').bail().isEmail(),
    checkValidationResult,
  ],
  PasswordController.RequestResetLink
);

/* -------------------------------------------------------------------------- */
/*             GET:PUBLIC {apiPrefix}/password/reset?token={token}            */
/* -------------------------------------------------------------------------- */

router.get(
  '/reset',
  [query('token', 'Token is missing').exists({ checkFalsy: true }), checkValidationResult],
  PasswordController.VerifyResetToken
);

/* -------------------------------------------------------------------------- */
/*            PATCH:PUBLIC {apiPrefix}/password/reset?token={token}           */
/* -------------------------------------------------------------------------- */

router.patch(
  '/reset',
  [
    query('token', 'Token is missing').exists({ checkFalsy: true }),
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
        if (value !== req.body.password)
          throw new Error('Password confirmation does not match password');
        return true;
      }),
    checkValidationResult,
  ],
  PasswordController.ResetPassword
);

// @route   PATCH $prefix/password/change
// @desc    Change user password
// @access  Private
// TODO: REFACTOR
router.patch(
  '/change',
  [
    authenticate,
    check('currentPassword', 'Current password is required').exists({
      checkFalsy: true,
    }),
    check('newPassword', 'New password is required')
      .exists({ checkFalsy: true })
      .bail()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('confirmNewPassword')
      .exists({ checkFalsy: true })
      .withMessage('New password confirmation is required')
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.newPassword)
          throw new Error('Password confirmation does not match password');
        return true;
      }),
  ],
  PasswordChange
);

export default router;
