import authRoutes from './auth';
import emailRoutes from './email';
import express from 'express';
import passwordRoutes from './password';
import profileRoutes from './profiles';
import usersRoutes from './users';

const routes = express.Router();

routes.all('/', (req, res) =>
  res.send(`API Version 1.0 | Request Method: ${req.method} | Status: Running (${new Date()})`)
);

routes.use('/auth', authRoutes);
routes.use('/email', emailRoutes);
routes.use('/password', passwordRoutes);
routes.use('/profiles', profileRoutes);
routes.use('/users', usersRoutes);
routes.use('*', (_req, res) => res.status(400).send('404 Not Found'));

export default routes;
