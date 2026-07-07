import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { taskToDto } from '../../../../../lib/server/serialize';
import { publishToUser, publishToCampus } from '../../../../../lib/server/events';

// GET /api/v1/tasks/:id — campus-scoped (you can never fetch another campus's task).
export const GET = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
    include: { category: true, customer: true, offers: { select: { id: true } } },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  return ok({ task: taskToDto(task, session.sub) });
});

const PatchBody = z.object({
  description: z.string().trim().max(500).optional(),
  hall: z.string().trim().max(60).optional(),
  when: z.string().trim().max(40).optional(),
  priceCents: z.number().int().min(1).max(99900).optional(),
});

// PATCH /api/v1/tasks/:id — the poster edits their listing while it's still
// OPEN (typo, time change, budget tweak). Once a buddy is accepted the deal is
// locked — edits after that go through cancel + repost, so the agreed terms
// can't shift under anyone. Open bidders are told the post changed.
export const PATCH = handler(async (req, { params, session }) => {
  const body = await parseBody(req, PatchBody);
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  if (task.customerId !== session.sub) fail(403, 'FORBIDDEN', 'Only the poster can edit this task');
  if (task.status !== 'OPEN') fail(409, 'BAD_STATE', 'Only open tasks can be edited — a deal is already agreed');

  // Non-study titles derive from the description, so keep them in sync.
  const newTitle =
    body.description !== undefined && !task.study
      ? body.description.trim()
        ? body.description.trim().slice(0, 60)
        : task.title
      : undefined;

  const updated = await db().task.update({
    where: { id: task.id },
    data: {
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(newTitle ? { title: newTitle } : {}),
      ...(body.hall !== undefined ? { hall: body.hall || null } : {}),
      ...(body.when !== undefined ? { whenText: body.when || null } : {}),
      ...(body.priceCents !== undefined ? { budgetCents: body.priceCents } : {}),
    },
    include: { category: true, customer: true, offers: { select: { id: true } } },
  });

  const openOffers = await db().offer.findMany({
    where: { taskId: task.id, state: { in: ['PENDING', 'COUNTERED'] } },
    select: { providerId: true },
  });
  if (openOffers.length > 0) {
    await db().notification.createMany({
      data: openOffers.map((o) => ({
        userId: o.providerId,
        type: 'task.updated',
        title: `“${updated.title}” was updated by ${session.name}`,
        body: 'Check the latest details before you continue.',
        data: { taskId: task.id },
      })),
    });
    for (const o of openOffers) publishToUser(o.providerId, { kind: 'task', taskId: task.id });
  }
  publishToCampus(session.campusId, { kind: 'task', taskId: task.id });
  return ok({ task: taskToDto(updated, session.sub) });
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

  const openOffers = await db().offer.findMany({
    where: { taskId: task.id, state: { in: ['PENDING', 'COUNTERED'] } },
    select: { providerId: true },
  });
  await db().$transaction(async (tx) => {
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
  for (const o of openOffers) publishToUser(o.providerId, { kind: 'task', taskId: task.id });
  publishToCampus(session.campusId, { kind: 'task', taskId: task.id });
  return ok({ cancelled: true });
});
