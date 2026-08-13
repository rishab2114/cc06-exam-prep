import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';

export const dynamic = 'force-dynamic';

// GET /api/v1/public/stats — unauthenticated, aggregate counts only (no task
// or user detail leaks). Powers the landing page's "this is a real, live
// marketplace" proof. This public deployment is an interactive demo, so only
// the seeded NTU personas are counted and every label can be explicit about the
// numbers being sample data rather than traction.
export const GET = handler(
  async () => {
    const campus = await db().campus.findUnique({ where: { code: 'NTU' }, select: { id: true } });
    if (!campus) return ok({ openTasks: 0, completedTasks: 0, listedServices: 0, demo: true });

    const demoRows = { campusId: campus.id, customerId: { startsWith: 'demo-user-' } };
    const [openTasks, completedTasks, listedServices] = await Promise.all([
      db().task.count({ where: { ...demoRows, kind: 'REQUEST', status: 'OPEN', deletedAt: null } }),
      db().task.count({ where: { ...demoRows, kind: 'REQUEST', status: 'COMPLETED' } }),
      db().task.count({ where: { ...demoRows, kind: 'OFFER', status: 'OPEN', deletedAt: null } }),
    ]);
    return ok({ openTasks, completedTasks, listedServices, demo: true });
  },
  { auth: false },
);
