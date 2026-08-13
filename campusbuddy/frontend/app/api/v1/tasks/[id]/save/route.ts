import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../../lib/server/http';

// POST /api/v1/tasks/:id/save — bookmark a task. Idempotent (upsert): tapping
// save twice is a no-op, not an error.
export const POST = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
    select: { id: true },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');

  await db().savedTask.upsert({
    where: { userId_taskId: { userId: session.sub, taskId: task.id } },
    update: {},
    create: { userId: session.sub, taskId: task.id },
  });
  return ok({ saved: true });
});

// DELETE /api/v1/tasks/:id/save — remove the bookmark. Idempotent.
export const DELETE = handler(async (_req, { params, session }) => {
  await db().savedTask.deleteMany({ where: { userId: session.sub, taskId: params.id } });
  return ok({ saved: false });
});
