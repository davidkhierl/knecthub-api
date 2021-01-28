import { TokenInvalidate } from '../controllers/TokenController';
import express from 'express';

const router = express.Router();

// @route   GET $prefix/token/refresh
// @desc    Refresh access token
// @access  Public
// router.get('/refresh', TokenRefresh);

// @route   GET $prefix/token/refresh
// @desc    Clear client refresh token cookie
// @access  Public
// TODO: REFACTOR
router.get('/invalidate', TokenInvalidate);

export default router;
