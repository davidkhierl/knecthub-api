import {
  ConnectionApprove,
  ConnectionList,
  ConnectionRemove,
  ConnectionRequest,
} from '../controllers/ConnectionController';

import authenticate from '../middleware/authenticate';
import express from 'express';

const router = express.Router();

// @route   POST api/connection/request
// @desc    Send connection request
// @access  Private
router.get('', authenticate, ConnectionList);

router.post('/request', authenticate, ConnectionRequest);

router.put('/approve', authenticate, ConnectionApprove);

router.delete('', authenticate, ConnectionRemove);

export default router;
