import { NotificationSend } from '../controllers/NotificationController';
import authenticate from '../middleware/authenticate';
import express from 'express';

const router = express.Router();

router.post('/sendnotification', authenticate, NotificationSend);

export default router;
