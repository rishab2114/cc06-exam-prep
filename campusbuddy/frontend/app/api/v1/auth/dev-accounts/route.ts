import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';
import { isDevAuth, isDemoMode, DEMO_USER_PREFIX } from '../../../../../lib/server/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/auth/dev-accounts — lists accounts for one-tap sign-in on the
// login screen. Two tiers, so a public demo never leaks real people:
//   • dev-auth (local, or explicit ALLOW_DEV_AUTH): every account, so you can
//     spin up several students and hop between them to test chat/offers.
//   • demo mode (no email provider, e.g. the hosted demo): ONLY the seeded
//     demo personas — no real student's name or email is ever returned.
// Inert (empty) on any email-configured deployment.
export const GET = handler(
  async () => {
    const full = isDevAuth();
    if (!full && !isDemoMode()) return ok({ dev: false, accounts: [] });
    const users = await db().user.findMany({
      where: { isSuspended: false, ...(full ? {} : { id: { startsWith: DEMO_USER_PREFIX } }) },
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
        isDemo: u.id.startsWith(DEMO_USER_PREFIX),
      })),
    });
  },
  { auth: false },
);
