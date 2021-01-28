import Token from '../models/Token';
import { User } from '../models';
import config from '../config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

/**
 * Token utility for generating new access token and automatically refresh the token for the user.
 * @param userId User id needed for the jwt payload
 * @param refreshToken Refresh token to be refreshed
 * @returns New access and refresh token
 */
export async function generateUserAccessTokens(userId: string, refreshToken?: string) {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  const payload = {
    sub: user.id,
    name: user.fullName,
  };

  const NEW_ACCESS_TOKEN = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRATION,
  });

  const NEW_REFRESH_TOKEN = uuid();

  if (refreshToken) {
    try {
      await Token.findOne(
        {
          user: userId,
          token: refreshToken,
          type: 'refresh_token',
          consumed: false,
          invalidated: false,
        },
        (err: any, token: any) => {
          if (err) throw new Error(err);

          if (!token) throw new Error('Refresh token not found');

          if (moment().diff(token.expiresIn) >= 0) throw new Error('Refresh token expired');

          token.token = NEW_REFRESH_TOKEN;
          token.expiresIn = config.REFRESH_TOKEN_EXPIRATION;
          token.save();
        }
      );
    } catch (error) {
      throw new Error(error.message);
    }
  } else {
    try {
      await Token.create({
        user: userId,
        token: NEW_REFRESH_TOKEN,
        type: 'refresh_token',
        expiresIn: config.REFRESH_TOKEN_EXPIRATION,
      });
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

export type TokenHash = ReturnType<typeof encryptToken>;
