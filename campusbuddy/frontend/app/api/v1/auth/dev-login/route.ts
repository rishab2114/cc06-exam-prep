import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { isDevAuth, createSessionCookie } from '../../../../../lib/server/auth';

// POST /api/v1/auth/dev-login — one-tap sign-in as any existing account, so a
// single person can drive every side of the marketplace: create a few students
// with the email→code flow, then hop between them here without re-entering
// codes. DEV ONLY: refuses unless RESEND_API_KEY is unset, so it's inert on any
// email-configured (production) deployment. Only signs in accounts that already
// exist — it never creates one (that's what the code flow is for).
const Body = z.object({ email: z.string().email().max(120) });

export const POST = handler(
  async (req) => {
    if (!isDevAuth()) fail(403, 'DEV_ONLY', 'Dev login is disabled on this server');
    const { email } = await parseBody(req, Body);
    const user = await db().user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { campus: true },
    });
    if (!user) {
      fail(404, 'NO_ACCOUNT', 'No account with that email yet — sign up with the code flow first');
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
