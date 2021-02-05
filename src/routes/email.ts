import { body, query } from 'express-validator';

import EmailController from '../controllers/EmailController';
import authenticate from '../middleware/authenticate';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';

const router = express.Router();

/**
 * GET:PUBLIC {apiPrefix}/email/verify?token={token}
 */
router.get(
  '/verify',
  [query('token', 'Token is missing').exists({ checkFalsy: true }), checkValidationResult],
  EmailController.VerifyEmail
);

/**
 * PATCH:PRIVATE {apiPrefix}/email/primary
 */
router.patch(
  '/primary',
  authenticate,
  [body('email').exists({ checkFalsy: true }), checkValidationResult],
  EmailController.UpdatePrimaryEmail
);

export default router;
