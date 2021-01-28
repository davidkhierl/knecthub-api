import config from '../config';
import mongoose from 'mongoose';

/**
 * Initialize database connection.
 * @param successCallback Callback function to invoke once connection succeeds.
 * @param errorCallback Callback function when error occurs.
 */
const connect = (successCallback?: () => void, errorCallback?: (error: any) => void) => {
  console.log('MongoDB:', 'Connecting database...');

  mongoose
    .connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .catch((error) => console.error('MongoDB:', error.message));

  mongoose.connection.once('open', function () {
    console.log('MongoDB:', 'Database connected.');
    if (successCallback) successCallback();
  });

  mongoose.connection.on('error', (error) => {
    if (errorCallback) errorCallback(error);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB: Disconnected.');
  });
};

export default { connect };
