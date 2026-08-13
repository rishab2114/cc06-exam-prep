import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { isDevAuth, isDemoMode, DEMO_USER_PREFIX, createSessionCookie } from '../../../../../lib/server/auth';

// POST /api/v1/auth/dev-login — one-tap sign-in without an email code. Two tiers:
//   • dev-auth (local, or explicit ALLOW_DEV_AUTH): ANY existing account, so one
//     person can drive every side of the marketplace without re-entering codes.
//   • demo mode (no email provider, e.g. the hosted demo): ONLY the seeded demo
//     personas, so a public demo can never be used to take over a real student's
//     account. Real students sign in with an emailed code.
// Either way it only signs in accounts that already exist — it never creates one.
const Body = z.object({ email: z.string().email().max(120) });

export const POST = handler(
  async (req) => {
    const full = isDevAuth();
    if (!full && !isDemoMode()) fail(403, 'DEV_ONLY', 'Dev login is disabled on this server');
    const { email } = await parseBody(req, Body);
    const user = await db().user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { campus: true },
    });
    if (!user) {
      fail(404, 'NO_ACCOUNT', 'No account with that email yet — sign up with the code flow first');
    }
    if (!full && !user.id.startsWith(DEMO_USER_PREFIX)) {
      // Demo mode: hard boundary — only fake personas, never a real student.
      fail(403, 'DEMO_ONLY', 'Only demo accounts can be used on this demo deployment');
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
