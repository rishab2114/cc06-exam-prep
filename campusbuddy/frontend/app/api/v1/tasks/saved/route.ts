import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';
import { taskToDto } from '../../../../../lib/server/serialize';

export const dynamic = 'force-dynamic';

// GET /api/v1/tasks/saved — the caller's bookmarked tasks, newest save first.
// Excludes tasks that were deleted since being saved.
export const GET = handler(async (_req, { session }) => {
  const saved = await db().savedTask.findMany({
    where: { userId: session.sub, task: { deletedAt: null } },
    include: {
      task: { include: { category: true, customer: true, offers: { select: { id: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok({ tasks: saved.map((s) => taskToDto(s.task, session.sub)) });
});
