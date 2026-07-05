import { z } from 'zod';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';
import { publishToUser } from '../../../../../../lib/server/events';

// POST /api/v1/tasks/:id/report — either party flags a problem on a task they're
// involved in (no-show, felt unsafe, work not as agreed, payment issue). Raises
// a Dispute + a SafetyEvent for the admin queue and confirms to the reporter.
// We deliberately do NOT notify the reported person — safety reports must not
// invite retaliation; a human reviews from the admin side.
const REASONS = ['no_show', 'unsafe', 'not_as_agreed', 'payment', 'other'] as const;
const Body = z.object({
  reason: z.enum(REASONS),
  details: z.string().trim().max(500).optional(),
});

export const POST = handler(async (req, { params, session }) => {
  const { reason, details } = await parseBody(req, Body);
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  const isParty = task.customerId === session.sub || task.providerId === session.sub;
  if (!isParty) fail(403, 'FORBIDDEN', 'Only the people on this task can report it');

  const reasonText = { no_show: 'No-show', unsafe: 'Felt unsafe', not_as_agreed: 'Work not as agreed', payment: 'Payment issue', other: 'Other' }[reason];

  await db().$transaction(async (tx) => {
    await tx.dispute.create({
      data: { taskId: task.id, raisedBy: session.sub, reason: details ? `${reasonText}: ${details}` : reasonText },
    });
    await tx.safetyEvent.create({
      data: { taskId: task.id, userId: session.sub, kind: 'REPORT', payload: { reason, details: details ?? null } },
    });
    // Active tasks freeze into DISPUTED for review; completed tasks keep their
    // status but still carry the dispute record.
    if (task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS') {
      await tx.task.update({ where: { id: task.id }, data: { status: 'DISPUTED' } });
      await tx.taskEvent.create({
        data: { taskId: task.id, actorId: session.sub, fromStatus: task.status, toStatus: 'DISPUTED', meta: { reason } },
      });
    }
    await tx.notification.create({
      data: {
        userId: session.sub,
        type: 'report.filed',
        title: `Report received on “${task.title}”`,
        body: 'Thanks — our team will review this and follow up. Contact hello@campusbuddy.sg for anything urgent.',
        data: { taskId: task.id },
      },
    });
  });
  publishToUser(session.sub, { kind: 'task', taskId: task.id });
  return ok({ reported: true });
});
