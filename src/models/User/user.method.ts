import { Document } from 'mongoose';
import Token from '../../models/Token';
import { UserDocument } from './user.types';
import { generateAccessToken } from '../../utils/token.utils';
import { v4 as uuidv4 } from 'uuid';

// Generate email verification token
export async function createEmailVerificationToken(this: Document<UserDocument>, expiresIn?: Date) {
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
export async function createPasswordResetToken(this: UserDocument) {
  const token = uuidv4();

  await Token.create({
    user: this.id,
    token,
    type: 'password_reset',
  });

  return token;
}

// Create access token.
export async function createAccessToken(this: UserDocument) {
  const [accessToken, refreshToken] = await generateAccessToken(this.id);

  return { accessToken, refreshToken };
}
