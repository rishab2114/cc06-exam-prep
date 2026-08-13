import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { createSessionCookie } from '../../../../../lib/server/auth';
import { verifyPassword } from '../../../../../lib/server/password';
import { rateLimit } from '../../../../../lib/server/rateLimit';

const Body = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(200),
});

// POST /api/v1/auth/login — email + password sign-in.
export const POST = handler(
  async (req) => {
    const { email, password } = await parseBody(req, Body);
    const cleaned = email.trim().toLowerCase();

    // Throttle guessing. Keyed on the address so one account can't be ground
    // through, and deliberately tighter than the signup limit.
    rateLimit(`auth:login:${cleaned}`, 10, 10 * 60_000);

    const user = await db().user.findUnique({
      where: { email: cleaned },
      include: { campus: true },
    });

    // One generic failure for "no such account", "no password set" and "wrong
    // password" — anything more specific tells an attacker which addresses are
    // registered. We still run the hash comparison when we can so the timing of
    // a wrong password matches a wrong address as closely as is practical.
    const good = await verifyPassword(password, user?.passwordHash ?? null);
    if (!user || !good) {
      fail(401, 'BAD_CREDENTIALS', 'That email or password is incorrect');
    }
    if (user.isSuspended) fail(403, 'SUSPENDED', 'This account is suspended');

    await createSessionCookie({
      sub: user.id,
      email: user.email,
      name: user.fullName,
      campusId: user.campusId,
      campusCode: user.campus.code,
    });
    return ok({ user: { id: user.id, name: user.fullName, email: user.email, campus: user.campus.code } });
  },
  { auth: false },
);
