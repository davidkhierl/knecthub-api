import express from 'express';
import url from 'url';

/**
 * Get current request url.
 * @param req Express request object.
 */
const getRequestUrl = (req: express.Request) => {
  // TODO: REFACTOR
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl,
  });
};

export default getRequestUrl;
