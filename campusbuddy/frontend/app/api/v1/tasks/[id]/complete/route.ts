import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../../lib/server/http';
import { publishToUser } from '../../../../../../lib/server/events';

// POST /api/v1/tasks/:id/complete — the assigned buddy marks the job done.
// Walks ASSIGNED -> IN_PROGRESS -> COMPLETED (both edges audited).
export const POST = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  if (task.providerId !== session.sub) fail(403, 'FORBIDDEN', 'Only the assigned buddy can complete this');
  if (task.status !== 'ASSIGNED' && task.status !== 'IN_PROGRESS') {
    fail(409, 'BAD_STATE', `Task is ${task.status.toLowerCase()} — nothing to complete`);
  }

  await db().$transaction(async (tx) => {
    if (task.status === 'ASSIGNED') {
      await tx.taskEvent.create({
        data: { taskId: task.id, actorId: session.sub, fromStatus: 'ASSIGNED', toStatus: 'IN_PROGRESS' },
      });
    }
    await tx.task.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', startedAt: task.startedAt ?? new Date(), completedAt: new Date() },
    });
    await tx.taskEvent.create({
      data: { taskId: task.id, actorId: session.sub, fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED' },
    });
    await tx.notification.create({
      data: {
        userId: task.customerId,
        type: 'task.completed',
        title: `“${task.title}” is done ✅`,
        body: 'Rate your buddy when you have a sec.',
        data: { taskId: task.id },
      },
    });
  });
  publishToUser(task.customerId, { kind: 'task', taskId: task.id });
  return ok({ completed: true });
});
