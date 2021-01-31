import moment from 'moment';

enum API_VERSIONS {
  v1 = 'v1',
  v2 = 'v2',
}

const config = {
  ACCESS_TOKEN_EXPIRATION: '15min',
  API_VERSIONS: API_VERSIONS,
  CLIENT_URL: process.env.CLIENT_URL || '',
  COOKIE_EXPIRATION: moment().add(1, 'year').toDate(),
  JWT_EMAIL_VERIFICATION_SECRET: process.env.JWT_EMAIL_VERIFICATION_SECRET || '',
  JWT_PASSWORD_RESET_SECRET: process.env.JWT_PASSWORD_RESET_SECRET || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  LINKEDIN_KEY: process.env.LINKEDIN_KEY || '',
  LINKEDIN_SECRET: process.env.LINKEDIN_SECRET || '',
  MONGO_URI: process.env.MONGO_URI || '',
  PORT: process.env.PORT || 5000,
  REFRESH_TOKEN_EXPIRATION: moment().add(6, 'months').toDate(),
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SUPPORT_MAIL: 'support@streamapp.io',
};

Object.freeze(config);

export default config;
