import { db } from '../../../../lib/server/db';
import { handler, ok } from '../../../../lib/server/http';
import { providerStatsFor } from '../../../../lib/server/serialize';

// Reads the session cookie — never prerender.
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { session }) => {
  const [user, stats] = await Promise.all([
    db().user.findUnique({ where: { id: session.sub }, include: { campus: true } }),
    providerStatsFor(db(), [session.sub]),
  ]);
  const s = stats.get(session.sub);
  return ok({
    user: user && {
      id: user.id,
      name: user.fullName,
      email: user.email,
      campus: user.campus.code,
      hall: user.hall,
      verifiedAt: user.emailVerifiedAt,
      rating: s?.rating ?? null,
      jobsDone: s?.jobs ?? 0,
    },
  });
});
