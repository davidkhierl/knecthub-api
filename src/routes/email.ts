import EmailController from '../controllers/EmailController';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';
import { query } from 'express-validator';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*              GET:PUBLIC {apiPrefix}/email/verify?token={token}             */
/* -------------------------------------------------------------------------- */

router.get(
  '/verify',
  [query('token', 'Token is missing').exists({ checkFalsy: true }), checkValidationResult],
  EmailController.VerifyEmail
);

export default router;
