import AuthController from '../controllers/AuthController';
import { body } from 'express-validator';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                     POST:PUBLIC {apiPrefix}/auth/login                     */
/* -------------------------------------------------------------------------- */

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password required').exists(),
    checkValidationResult,
  ],
  AuthController.Login
);

/* -------------------------------------------------------------------------- */
/*                     GET:PUBLIC {apiPrefix}/auth/logout                     */
/* -------------------------------------------------------------------------- */

router.get('/logout', AuthController.Logout);

// @route   POST $prefix/auth/linkedin
// @desc    Register or Signin user via Linkedin API
// @access  Public
// router.post('/linkedin', AuthLinkedIn);

export default router;
