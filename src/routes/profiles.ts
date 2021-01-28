import ProfileController from '../controllers/ProfileController';
import authenticate from '../middleware/authenticate';
import express from 'express';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                     GET:PRIVATE {apiPrefix}/profiles/me                    */
/* -------------------------------------------------------------------------- */

router.get('/me', authenticate, ProfileController.GetCurrentUserProfile);
