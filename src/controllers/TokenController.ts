import express from 'express';
import moment from 'moment';
import { revokeToken } from '../utils/token.utils';
import { setResponseCookies } from '../helpers/response.helpers';

// Clear and invalidate tokens
export const TokenInvalidate = async (req: express.Request, res: express.Response) => {
  try {
    // invalidate refresh token
    const { refreshToken } = req.cookies;

    await revokeToken(refreshToken);

    setResponseCookies(
      {
        cookies: [
          { name: 'accessToken', value: '' },
          { name: 'refreshToken', value: '' },
        ],
        options: {
          httpOnly: true,
          expires: moment().subtract(1, 'day').toDate(),
        },
      },
      res
    );

    return res.json({ success: true, message: 'Token invalidated' });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server Error 🔴');
  }
};
