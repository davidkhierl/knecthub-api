import config from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import database from './services/database';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import routes from './routes';

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
  app.use(`/`, (_req, res) => res.send(`© Knecthub 2021`));
  const server = http.createServer(app);

  server.listen(config.PORT, () => {
    console.log(`Server started: listening to port ${config.PORT}`);
  });
}
