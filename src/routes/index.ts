import authRoutes from './auth';
import emailRoutes from './email';
import express from 'express';
import passwordRoutes from './password';
import usersRoutes from './users';

const routes = express.Router();

routes.all('/', (req, res) =>
  res.send(`API Version 1.0 | Request Method: ${req.method} | Status: Running (${new Date()})`)
);

routes.use('/auth', authRoutes);
routes.use('/email', emailRoutes);
routes.use('/password', passwordRoutes);
routes.use('/users', usersRoutes);

export default routes;
