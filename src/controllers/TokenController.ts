import { StandardResponse } from '../typings/express';
import express from 'express';
import { revokeToken } from '../utils/token.utils';

// Clear and invalidate tokens
export const TokenInvalidate = async (
  req: express.Request,
  res: express.Response<StandardResponse>
) => {
  try {
    const { refreshToken } = req.cookies;

    await revokeToken(refreshToken);

    return res
      .clearCookie('accessToken')
      .clearCookie('refreshToken')
      .send({ message: 'Token invalidated', success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send({ message: 'Server error.', success: false });
  }
};
