import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

/**
 * Password hashing with scrypt — a memory-hard KDF that ships with Node, so we
 * get proper protection without pulling in bcrypt/argon2 (native builds are a
 * liability on serverless). Never store or compare a raw password.
 *
 * Format: "<saltHex>:<keyHex>". The salt is per-password, so identical
 * passwords produce different hashes and a stolen table can't be attacked with
 * one precomputed set.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEY_LEN);
  return `${salt}:${key.toString('hex')}`;
}

/**
 * Constant-time verification. Returns false rather than throwing on a malformed
 * stored value, so a bad row can't 500 the login endpoint.
 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(keyHex, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== KEY_LEN) return false;
  const actual = await scrypt(password, salt, KEY_LEN);
  // Lengths match by construction, so timingSafeEqual won't throw here.
  return timingSafeEqual(actual, expected);
}

/**
 * What we require of a new password. Deliberately length-first rather than a
 * character-class maze: length is what actually resists guessing, and fussy
 * rules push students toward "Passw0rd!" and a sticky note.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters';
  if (password.length > 200) return 'That password is too long';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include at least one letter and one number';
  }
  return null;
}
