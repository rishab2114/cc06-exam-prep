import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createHash, randomInt } from 'crypto';

/**
 * Session + login-code primitives. Sessions are HS256 JWTs in an httpOnly
 * SameSite=Lax cookie (CSRF-safe for our POST endpoints, JS can't read it).
 * Login codes are 6-digit, 10-minute, single-use; only a salted hash is stored.
 */
export const SESSION_COOKIE = 'cb_session';
const SESSION_DAYS = 30;

/**
 * "Dev auth" mode: login codes are surfaced on-screen and the one-tap account
 * switcher is enabled (sendLoginCode() returns the code too, so they stay in
 * lockstep). This is CONVENIENT but INSECURE — anyone can read a code for any
 * campus email and sign in as that user, and the switcher lists everyone. So it
 * is HARD-OFF in production by default: it only turns on when we're not running
 * a production build, or when an operator explicitly opts in with
 * ALLOW_DEV_AUTH=1 (documented as insecure, for a private demo only). Setting
 * RESEND_API_KEY (real email) also implies production auth — never surface codes
 * once a real provider is wired.
 */
export function isDevAuth(): boolean {
  if (process.env.RESEND_API_KEY) return false; // real email wired → always production auth
  if (process.env.ALLOW_DEV_AUTH === '1') return true; // explicit, knowingly-insecure opt-in
  return process.env.NODE_ENV !== 'production'; // safe default: only off-prod (local/dev)
}

/** A seeded demo persona — fake accounts the demo seed creates, never real students. */
export const DEMO_USER_PREFIX = 'demo-user-';

/**
 * "Demo mode": the deployment has no real email provider, so nobody can actually
 * receive a sign-in code. Rather than a dead login screen, we let anyone explore
 * the marketplace as one of the SEEDED DEMO PERSONAS (ids prefixed
 * `demo-user-`).
 *
 * This is safe in production, unlike dev-auth: it never reveals a real student's
 * code, never lists real accounts, and can only ever sign you in as a fake
 * persona. Real students still need email OTP. It switches itself off the moment
 * RESEND_API_KEY is set — a deployment with real email is a real marketplace.
 */
export function isDemoMode(): boolean {
  return !process.env.RESEND_API_KEY;
}

export interface Session {
  sub: string; // user id
  email: string;
  name: string;
  campusId: string;
  campusCode: string;
}

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? 'dev-secret-change-me';
  if (s === 'dev-secret-change-me' && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set in production');
  }
  return new TextEncoder().encode(s);
}

export async function createSessionCookie(session: Session): Promise<void> {
  const jwt = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  cookies().set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 3600,
    path: '/',
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' });
}

/** Session or null — route handlers decide how to respond. */
export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      campusId: String(payload.campusId),
      campusCode: String(payload.campusCode),
    };
  } catch {
    return null; // expired/garbled — treat as signed out, never crash
  }
}

// ---------- login codes ----------

/**
 * Thrown when email sign-in is genuinely unavailable: no email provider is
 * configured and we refuse to hand the code back to the caller. Defined here
 * (rather than as an http ApiError) because http.ts imports this module.
 */
export class EmailUnavailableError extends Error {
  constructor() {
    super('Email sign-in is not available on this deployment');
    this.name = 'EmailUnavailableError';
  }
}

export function newLoginCode(): string {
  return String(randomInt(100000, 1000000)); // 6 digits, crypto-random
}

export function hashLoginCode(email: string, code: string): string {
  return createHash('sha256')
    .update(`${email.toLowerCase()}:${code}:${process.env.AUTH_SECRET ?? 'dev-secret-change-me'}`)
    .digest('hex');
}

/**
 * Send the login code. With RESEND_API_KEY set this emails for real.
 *
 * Without a provider we only hand the code back when isDevAuth() allows it
 * (local dev / explicit opt-in) — returning it to the caller is exactly the
 * account-takeover vector we close in production: anyone could request a code
 * for a real student's address and read it out of the response. On a demo
 * deployment with no provider we therefore refuse rather than pretend to send;
 * visitors explore via the demo personas instead.
 */
export async function sendLoginCode(email: string, code: string): Promise<{ devCode?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!isDevAuth()) {
      throw new EmailUnavailableError();
    }
    console.warn(`[auth] RESEND_API_KEY not set — dev login code for ${email}: ${code}`);
    return { devCode: code };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'CampusBuddy <login@campusbuddy.app>',
      to: [email],
      subject: `${code} is your CampusBuddy code`,
      text: `Your CampusBuddy sign-in code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    }),
  });
  if (!res.ok) throw new Error(`email send failed: ${res.status}`);
  return {};
}
