import config from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import database from './services/database';
import express from 'express';
import http from 'http';
import routes from './routes';
import helmet from 'helmet';
import passport from 'passport';
import passportStrategy from './services/passport';

// Initialize database connection
database.connect(undefined, (error) => console.log(error));

// Express instance
const app = express();

// express settings
app.enable('trust proxy');

// Authentication strategy
passportStrategy(passport);

// Api middleware
app.use(cookieParser());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(passport.initialize());

// Api routes
app.use(`/${config.API_VERSIONS.v1}`, routes);
app.use(/[/]/, (_req, res) => res.send(`© Knecthub 2021`));
app.use('*', (_req, res) => res.status(400).send('404 Not Found'));

const server = http.createServer(app);

server.listen(config.PORT, () => {
  console.log(`Server started: listening to port ${config.PORT}`);
});
