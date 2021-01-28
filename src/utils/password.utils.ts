import Token from '../models/Token';
import dayjs from 'dayjs';

/**
 * Verify password reset token.
 * @param resetToken string
 */
export async function verifyPasswordResetToken(resetToken: string): Promise<boolean> {
  const token = await Token.findOne({
    token: resetToken,
    type: 'password_reset',
    consumed: false,
    invalidated: false,
  });

  if (!token) return false;

  if (dayjs().isAfter(dayjs(token.expiresIn))) return false;

  return true;
}
