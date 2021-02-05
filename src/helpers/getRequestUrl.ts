import express from 'express';

/**
 * Get current request url.
 * @param req Express request object.
 */
const getRequestUrl = (req: express.Request) => {
  return new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
};

export default getRequestUrl;
