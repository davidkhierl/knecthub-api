import AuthController from '../controllers/AuthController';
import { body } from 'express-validator';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';
import passport from 'passport';

const router = express.Router();

/**
 * POST:PUBLIC {apiPrefix}/auth/signin
 */
router.post(
  '/signin',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password required').exists(),
    checkValidationResult,
  ],
  AuthController.SignIn
);

/**
 * GET:PUBLIC {apiPrefix}/auth/logout
 */
router.get('/signout', AuthController.SignOut);

// @route   POST $prefix/auth/linkedin
// @desc    Register or Signin user via Linkedin API
// @access  Public
// router.post('/linkedin', AuthLinkedIn);

router.get('/refresh', AuthController.Refresh);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/callback/google',
  passport.authenticate('google', { session: false }),
  AuthController.SignInWithGoogleSuccess
);

export default router;
