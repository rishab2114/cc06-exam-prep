import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';
import { isDevAuth } from '../../../../../lib/server/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/auth/dev-accounts — lists accounts for one-tap sign-in on the
// login screen. In dev-auth mode (RESEND_API_KEY unset) it returns every
// account on the server — the seeded demo students AND any real account you
// create with the email→code flow — so you can spin up several students and
// hop between them to test chat/offers. Returns an empty list on any
// email-configured (production) deployment, so it's inert there.
export const GET = handler(
  async () => {
    if (!isDevAuth()) return ok({ dev: false, accounts: [] });
    const users = await db().user.findMany({
      where: { isSuspended: false },
      include: { campus: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    return ok({
      dev: true,
      accounts: users.map((u) => ({
        email: u.email,
        name: u.fullName,
        campus: u.campus.code,
        hall: u.hall,
        isDemo: u.id.startsWith('demo-user-'),
      })),
    });
  },
  { auth: false },
);
