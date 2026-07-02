import { db } from '../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../lib/server/http';
import { taskToDto } from '../../../../../lib/server/serialize';

// GET /api/v1/tasks/:id — campus-scoped (you can never fetch another campus's task).
export const GET = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
    include: { category: true, customer: true, offers: { select: { id: true } } },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  return ok({ task: taskToDto(task, session.sub) });
});

// DELETE /api/v1/tasks/:id — the poster cancels their own task while it's still
// open. Open offer threads are closed and their providers told why.
export const DELETE = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  if (task.customerId !== session.sub) fail(403, 'FORBIDDEN', 'Only the poster can cancel this task');
  if (task.status !== 'OPEN') fail(409, 'BAD_STATE', 'Only open tasks can be cancelled');

  await db().$transaction(async (tx) => {
    const openOffers = await tx.offer.findMany({
      where: { taskId: task.id, state: { in: ['PENDING', 'COUNTERED'] } },
      select: { providerId: true },
    });
    await tx.offer.updateMany({
      where: { taskId: task.id, state: { in: ['PENDING', 'COUNTERED'] } },
      data: { state: 'DECLINED' },
    });
    await tx.task.update({
      where: { id: task.id },
      data: { status: 'CANCELLED', deletedAt: new Date() },
    });
    await tx.taskEvent.create({
      data: { taskId: task.id, actorId: session.sub, fromStatus: 'OPEN', toStatus: 'CANCELLED' },
    });
    if (openOffers.length > 0) {
      await tx.notification.createMany({
        data: openOffers.map((o) => ({
          userId: o.providerId,
          type: 'task.cancelled',
          title: `“${task.title}” was cancelled by the poster`,
          data: { taskId: task.id },
        })),
      });
    }
  });
  return ok({ cancelled: true });
});
