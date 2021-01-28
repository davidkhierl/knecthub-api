import { Document } from 'mongoose';
import Token from '../../models/Token';
import { UserDocument } from './user.types';
import { generateUserAccessTokens } from '../../utils/token.utils';
import { v4 as uuidv4 } from 'uuid';

export interface UserMethod {
  generateVerificationToken: (expiresIn?: Date) => Promise<string>;
  generatePasswordResetToken: () => Promise<string>;
}

// Generate email verification token
export async function generateEmailVerificationToken(
  this: Document<UserDocument>,
  expiresIn?: Date
) {
  const token = uuidv4();

  const newToken = new Token({
    user: this.id,
    token,
    type: 'email_verification',
    expiresIn,
  });

  await newToken.save();

  return token;
}

// Generate reset password token
export async function generatePasswordResetToken(this: UserDocument) {
  const resetToken = uuidv4();

  await Token.create({
    user: this.id,
    token: resetToken,
    type: 'password_reset',
  });

  return resetToken;
}

// Generate access token.
export async function generateAccessToken(this: UserDocument) {
  // const payload = {
  //   sub: this.id,
  //   name: this.fullName,
  // };

  // const accessToken = jwt.sign(payload, config.JWT_SECRET, {
  //   expiresIn: config.ACCESS_TOKEN_EXPIRATION,
  // });

  // const newRefreshToken = uuidv4();

  // await Token.create({
  //   user: this.id,
  //   token: newRefreshToken,
  //   type: 'refresh_token',
  //   expiresIn: config.REFRESH_TOKEN_EXPIRATION,
  // });

  // return {
  //   accessToken,
  //   refreshToken: newRefreshToken,
  // };
  const [accessToken, refreshToken] = await generateUserAccessTokens(this.id);

  return { accessToken, refreshToken };
}
