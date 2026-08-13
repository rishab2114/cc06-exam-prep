import { z } from 'zod';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';
import { publishToCampus } from '../../../../../../lib/server/events';
import { notifyUser } from '../../../../../../lib/server/notify';

// POST /api/v1/tasks/:id/cancel-assignment — either the poster or the assigned
// buddy calls off a deal that's already been struck (change of plans, no-show,
// running late and can't make it). ASSIGNED/IN_PROGRESS → CANCELLED, with a
// reason, and the other side is told who cancelled and why.
const Body = z.object({ reason: z.string().trim().max(300).optional() });

export const POST = handler(async (req, { params, session }) => {
  const { reason } = await parseBody(req, Body);
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  const isCustomer = task.customerId === session.sub;
  const isProvider = task.providerId === session.sub;
  if (!isCustomer && !isProvider) fail(403, 'FORBIDDEN', 'Only the poster or their buddy can cancel this');
  if (task.status !== 'ASSIGNED' && task.status !== 'IN_PROGRESS') {
    fail(409, 'BAD_STATE', `This task is ${task.status.toLowerCase()} — nothing to cancel`);
  }

  const other = isCustomer ? task.providerId! : task.customerId;
  const who = isCustomer ? 'the poster' : 'your buddy';
  await db().$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: { status: 'CANCELLED', deletedAt: new Date() },
    });
    await tx.taskEvent.create({
      data: {
        taskId: task.id,
        actorId: session.sub,
        fromStatus: task.status,
        toStatus: 'CANCELLED',
        meta: reason ? { reason } : undefined,
      },
    });
  });
  await notifyUser({
    userId: other,
    type: 'task.cancelled',
    title: `“${task.title}” was cancelled by ${who}`,
    body: reason ? `Reason: ${reason}` : undefined,
    taskId: task.id,
  });
  publishToCampus(session.campusId, { kind: 'task', taskId: task.id });
  return ok({ cancelled: true });
});
