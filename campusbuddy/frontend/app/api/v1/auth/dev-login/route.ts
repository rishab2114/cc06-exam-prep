import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { isDevAuth, createSessionCookie } from '../../../../../lib/server/auth';

// POST /api/v1/auth/dev-login — one-tap sign-in as a seeded demo student, so a
// single person can drive both sides of the marketplace. DEV ONLY: refuses
// unless RESEND_API_KEY is unset, and only ever logs in the seeded demo users.
const Body = z.object({ email: z.string().email().max(120) });

export const POST = handler(
  async (req) => {
    if (!isDevAuth()) fail(403, 'DEV_ONLY', 'Dev login is disabled on this server');
    const { email } = await parseBody(req, Body);
    const user = await db().user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { campus: true },
    });
    if (!user || !user.id.startsWith('demo-user-')) {
      fail(404, 'NOT_DEMO', 'That is not a demo account — seed them with prisma:seed:demo');
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
