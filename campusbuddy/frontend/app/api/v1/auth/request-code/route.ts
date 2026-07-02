import { z } from 'zod';
import { campusForEmail } from '@campusbuddy/shared';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { newLoginCode, hashLoginCode, sendLoginCode } from '../../../../../lib/server/auth';

const Body = z.object({ email: z.string().email().max(120) });

// Step 1 of sign-in: campus-gated email -> 6-digit code (10 min TTL).
// Rate-limited: max 3 live codes per email to stop email-bombing.
export const POST = handler(
  async (req) => {
    const { email } = await parseBody(req, Body);
    const cleaned = email.trim().toLowerCase();
    const campus = campusForEmail(cleaned);
    if (!campus) fail(403, 'NOT_CAMPUS_EMAIL', 'Use your university email to join');

    const recent = await db().loginCode.count({
      where: { email: cleaned, expiresAt: { gt: new Date() }, consumedAt: null },
    });
    if (recent >= 3) fail(429, 'TOO_MANY_CODES', 'Too many codes requested — try again in a few minutes');

    const code = newLoginCode();
    await db().loginCode.create({
      data: {
        email: cleaned,
        codeHash: hashLoginCode(cleaned, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    const { devCode } = await sendLoginCode(cleaned, code);
    return ok({ sent: true, campus: campus.code, ...(devCode ? { devCode } : {}) });
  },
  { auth: false },
);
