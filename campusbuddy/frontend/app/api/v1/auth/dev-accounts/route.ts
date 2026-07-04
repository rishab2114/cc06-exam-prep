import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';
import { isDevAuth } from '../../../../../lib/server/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/auth/dev-accounts — lists the seeded demo students so the login
// screen can offer one-tap sign-in. Returns an empty list unless the server is
// in dev-auth mode (RESEND_API_KEY unset), so it's inert in production.
export const GET = handler(
  async () => {
    if (!isDevAuth()) return ok({ dev: false, accounts: [] });
    const users = await db().user.findMany({
      where: { id: { startsWith: 'demo-user-' } },
      include: { campus: true },
      orderBy: { fullName: 'asc' },
    });
    return ok({
      dev: true,
      accounts: users.map((u) => ({ email: u.email, name: u.fullName, campus: u.campus.code, hall: u.hall })),
    });
  },
  { auth: false },
);
