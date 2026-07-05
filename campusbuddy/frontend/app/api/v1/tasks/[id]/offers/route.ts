import { z } from 'zod';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';
import { offerToDto, providerStatsFor } from '../../../../../../lib/server/serialize';
import { publishToUser } from '../../../../../../lib/server/events';

// GET — the task owner sees every offer; a provider sees only their own thread.
export const GET = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');

  const offers = await db().offer.findMany({
    where: {
      taskId: task.id,
      ...(task.customerId === session.sub ? {} : { providerId: session.sub }),
    },
    include: { provider: true },
    orderBy: { amountCents: 'asc' },
  });
  const stats = await providerStatsFor(db(), offers.map((o) => o.providerId));
  return ok({
    offers: offers.map((o) => offerToDto(o, session.sub, task.customerId, stats.get(o.providerId))),
  });
});

const Body = z.object({
  amountCents: z.number().int().min(1).max(99900),
  message: z.string().max(300).optional(),
});

// POST — a provider opens a negotiation thread (one per task+provider, enforced
// by the DB unique). Their quote becomes the live number on the table.
export const POST = handler(async (req, { params, session }) => {
  const { amountCents, message } = await parseBody(req, Body);
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, deletedAt: null },
    include: { customer: true },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  if (task.status !== 'OPEN') fail(409, 'NOT_OPEN', 'This task is no longer taking offers');
  if (task.customerId === session.sub) fail(403, 'OWN_TASK', 'You cannot offer on your own task');

  const existing = await db().offer.findUnique({
    where: { taskId_providerId: { taskId: task.id, providerId: session.sub } },
  });
  if (existing && (existing.state === 'PENDING' || existing.state === 'COUNTERED')) {
    fail(409, 'ALREADY_OFFERED', 'You already have an open offer on this task');
  }

  const offer = existing
    ? await db().offer.update({
        where: { id: existing.id },
        data: { amountCents, message: message ?? null, state: 'PENDING', lastActor: 'PROVIDER', round: existing.round + 1 },
        include: { provider: true },
      })
    : await db().offer.create({
        data: { taskId: task.id, providerId: session.sub, amountCents, message: message ?? null },
        include: { provider: true },
      });

  await db().notification.create({
    data: {
      userId: task.customerId,
      type: 'offer.new',
      title: `${session.name} offered on “${task.title}”`,
      body: `They quoted S$${(amountCents / 100).toFixed(2)} — accept or bargain.`,
      data: { taskId: task.id, offerId: offer.id },
    },
  });
  publishToUser(task.customerId, { kind: 'task', taskId: task.id });
  return ok({ offer: offerToDto(offer, session.sub, task.customerId) }, 201);
});
