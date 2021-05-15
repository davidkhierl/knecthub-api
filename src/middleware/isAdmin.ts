import express from 'express';

/**
 * Check if user is an Admin.
 * @param req Express request
 * @param res Express response
 * @param next Express next
 */
function isAdmin(_req: express.Request, res: express.Response, _next: express.NextFunction) {
  // TODO: Refactor
  // if (req.user.isAdmin) return next();

  return res.status(401).send('Unauthorized!');
}

export default isAdmin;
