import { TokenDocument } from './token.types';
import dayjs from 'dayjs';

// Check token validity, returns boolean
export function isTokenValid(this: TokenDocument) {
  if (this.consumed || dayjs().isAfter(dayjs(this.expiresIn))) return false;

  return true;
}

// Set token status to consumed
export async function consumeToken(this: TokenDocument) {
  this.consumed = true;

  await this.save();

  return this;
}
