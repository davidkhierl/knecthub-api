import config from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import passport from 'passport';
import passportStrategy from './services/passport';
import routes from './routes';

async function bootstrap() {
  /* -------------------------------------------------------------------------- */
  /*                                  Database                                  */
  /* -------------------------------------------------------------------------- */

  mongoose.connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function () {
    console.log('Database connected');
  });

  /* -------------------------------------------------------------------------- */
  /*                                   Express                                  */
  /* -------------------------------------------------------------------------- */

  const app = express();

  app.enable('trust proxy');

  app.use(cookieParser());

  app.use(cors({ origin: config.CLIENT_URL, credentials: true }));

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(helmet());

  app.use(passport.initialize());

  app.use(`/${config.API_VERSIONS.v1}`, routes);

  app.use(/[/]/, (_req, res) => res.send(`Knecthub API`));

  app.use('*', (_req, res) => res.status(400).send('404 Not Found'));

  app.listen(config.PORT, () => {
    console.log(`Server started: listening to port ${config.PORT}`);
  });

  passportStrategy(passport);
}

bootstrap();
