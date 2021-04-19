import config from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import database from './services/database';
import express from 'express';
import http from 'http';
import routes from './routes';

import helmet from 'helmet';

// Initialize database connection first
// and invoke the serverInit if connection
// succeeds.
database.connect(serverInit, (error) => console.log(error));

/**
 * Initialize server
 */
function serverInit() {
  // Express instance
  const app = express();

  // Api middleware
  app.use(cookieParser());
  app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(helmet());

  // Api routes
  app.use(`/${config.API_VERSIONS.v1}`, routes);
  app.use(/[/]/, (_req, res) => res.send(`© Knecthub 2021`));
  app.use('*', (_req, res) => res.status(400).send('404 Not Found'));

  const server = http.createServer(app);

  server.listen(config.PORT, () => {
    console.log(`Server started: listening to port ${config.PORT}`);
  });
}
