import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import crypto from 'crypto';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

/**
 * Token utility for generating new access token and automatically refresh the token for the user.
 * @param userId User id needed for the jwt payload
 * @param refreshToken Refresh token to be refreshed
 * @returns New access and refresh token
 */
export async function generateAccessToken(userId: string, refreshToken?: string) {
  const user = await User.findById(userId);

  if (!user) throw new Error('Invalid Token.');

  const payload = {
    sub: user.id,
    name: user.fullName,
  };

  const NEW_ACCESS_TOKEN = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRATION,
  });

  let NEW_REFRESH_TOKEN: string = '';

  if (refreshToken) {
    try {
      const decodedRefreshToken = jwt.verify(refreshToken, config.JWT_SECRET) as {
        tokenId: string;
        token: string;
      };

      const tokenQuery = await Token.findOne({
        user: userId,
        token: decodedRefreshToken.token,
        type: 'refresh_token',
        consumed: false,
        invalidated: false,
      });

      if (!tokenQuery) {
        const tokenQueryId = await Token.findById(decodedRefreshToken.tokenId);

        if (!tokenQueryId) throw new Error('Refresh token not found');

        if (moment().diff(tokenQueryId.expiresIn) >= 0) throw new Error('Refresh token expired');

        const newRefreshToken = uuid();

        tokenQueryId.token = newRefreshToken;

        tokenQueryId.expiresIn = config.REFRESH_TOKEN_EXPIRATION;

        await tokenQueryId.save();

        NEW_REFRESH_TOKEN = jwt.sign(
          { tokenId: tokenQueryId._id, token: newRefreshToken },
          config.JWT_SECRET,
          { expiresIn: '182d' }
        );
      }

      if (tokenQuery) {
        if (moment().diff(tokenQuery.expiresIn) >= 0) throw new Error('Refresh token expired');

        const newRefreshToken = uuid();

        tokenQuery.token = newRefreshToken;

        tokenQuery.expiresIn = config.REFRESH_TOKEN_EXPIRATION;

        await tokenQuery.save();

        NEW_REFRESH_TOKEN = jwt.sign(
          { tokenId: tokenQuery._id, token: newRefreshToken },
          config.JWT_SECRET,
          { expiresIn: '182d' }
        );
      }
    } catch (error) {
      throw new Error(error.message);
    }
  } else {
    try {
      const token = new Token({
        user: userId,
        token: uuid(),
        type: 'refresh_token',
        expiresIn: config.REFRESH_TOKEN_EXPIRATION,
      });

      NEW_REFRESH_TOKEN = jwt.sign({ tokenId: token._id, token: token.token }, config.JWT_SECRET, {
        expiresIn: '182d',
      });

      await token.save();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  return [NEW_ACCESS_TOKEN, NEW_REFRESH_TOKEN];
}

/**
 * Revoke and invalidate token
 * @param refreshToken Refresh token to be revoke
 * @param deleteToken Completely delete the token on the database, defaults to false
 */
export async function revokeToken(refreshToken: string, deleteToken?: boolean) {
  try {
    if (refreshToken && !deleteToken)
      await Token.findOneAndUpdate({ token: refreshToken }, { invalidated: true });

    if (refreshToken && deleteToken) await Token.findOneAndDelete({ token: refreshToken });
  } catch (error) {
    throw new Error(error);
  }
}

// ? Learn how crypto works, basic fundamentals of encryption.
// TODO: Deep dive into crypto documentation.

const algorithm = 'aes-256-ctr';
const iv = crypto.randomBytes(16);
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

/**
 * Utility for encrypting token.
 * @param token string
 */
export function encryptToken(token: string) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
}

export type TokenHash = ReturnType<typeof encryptToken>;

/**
 * Utility for decrypting token.
 * @param hash token hash.
 */
export function decryptToken(hash: TokenHash) {
  const decipher = crypto.createCipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString();
}

/**
 * Verify token.
 * @param token string
 * @param type 'email_verification' | 'password_reset' | 'refresh_token' | undefined
 * @returns Promise<boolean>
 */
export async function verifyToken(
  token: string,
  type?: 'email_verification' | 'password_reset' | 'refresh_token' | undefined
): Promise<boolean> {
  const query = await Token.findOne({
    token,
    type,
    consumed: false,
    invalidated: false,
  });

  if (!query) return false;

  if (dayjs().isAfter(dayjs(query.expiresIn))) return false;

  return true;
}
