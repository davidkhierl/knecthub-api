import express from 'express';

/**
 * Check if user is an Admin.
 * @param req Express request
 * @param res Express response
 * @param next Express next
 */
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.user.isAdmin) return next();

  return res.status(401).send('Unauthorized!');
}

export default isAdmin;
