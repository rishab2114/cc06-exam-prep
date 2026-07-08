import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';

export const dynamic = 'force-dynamic';

// GET /api/v1/public/stats — unauthenticated, aggregate counts only (no task
// or user detail leaks). Powers the landing page's "this is a real, live
// marketplace" proof — the same trust signal Airbnb/Carousell lead with.
export const GET = handler(
  async () => {
    const [openTasks, completedTasks, campuses] = await Promise.all([
      db().task.count({ where: { status: 'OPEN', deletedAt: null } }),
      db().task.count({ where: { status: 'COMPLETED' } }),
      db().campus.count({ where: { isActive: true } }),
    ]);
    return ok({ openTasks, completedTasks, campuses });
  },
  { auth: false },
);
