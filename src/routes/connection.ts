import ConnectionController from '../controllers/ConnectionController';
import authenticate from '../middleware/authenticate';
import checkValidationResult from '../middleware/checkValidationResult';
import express from 'express';
import { query } from 'express-validator';

const router = express.Router();

router.get('/', authenticate, ConnectionController.GetUserConnections);

router.post(
  '/request',
  authenticate,
  [query('email', 'Email is missing.').exists({ checkFalsy: true }), checkValidationResult],
  ConnectionController.RequestConnection
);

router.post(
  '/accept',
  authenticate,
  [query('email', 'Email is missing.').exists({ checkFalsy: true }), checkValidationResult],
  ConnectionController.AcceptConnection
);

router.delete('/', authenticate);

export default router;
