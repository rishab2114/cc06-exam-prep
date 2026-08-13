import { Prisma } from '@prisma/client';
import { OfferState, OfferActor, canAct } from '@campusbuddy/shared';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../../lib/server/http';
import { publishToUser, publishToCampus } from '../../../../../../lib/server/events';
import { notifyUser } from '../../../../../../lib/server/notify';

// POST /api/v1/offers/:id/accept — the deal moment. One serializable
// transaction: offer -> ACCEPTED, sibling offers -> DECLINED, task -> ASSIGNED
// at the agreed price. The txn + a state re-check kills the double-accept race.
export const POST = handler(async (_req, { params, session }) => {
  const offer = await db().offer.findUnique({
    where: { id: params.id },
    include: { task: true },
  });
  if (!offer || offer.task.campusId !== session.campusId) fail(404, 'NOT_FOUND', 'Offer not found');

  const side =
    session.sub === offer.task.customerId
      ? OfferActor.CUSTOMER
      : session.sub === offer.providerId
        ? OfferActor.PROVIDER
        : null;
  if (!side) fail(403, 'FORBIDDEN', 'Not your negotiation');
  if (!canAct('accept', offer.state as OfferState, offer.lastActor as OfferActor, side)) {
    fail(409, 'NOT_YOUR_TURN', 'You can only accept the other side’s number');
  }

  try {
    await db().$transaction(
      async (tx) => {
        // Re-read inside the txn — the guards must hold at commit time.
        const fresh = await tx.offer.findUniqueOrThrow({ where: { id: offer.id }, include: { task: true } });
        if (fresh.state !== 'PENDING' && fresh.state !== 'COUNTERED') {
          throw new Error('OFFER_CLOSED');
        }
        if (fresh.task.status !== 'OPEN') throw new Error('TASK_TAKEN');

        await tx.offer.update({ where: { id: fresh.id }, data: { state: 'ACCEPTED' } });
        await tx.offer.updateMany({
          where: { taskId: fresh.taskId, id: { not: fresh.id }, state: { in: ['PENDING', 'COUNTERED'] } },
          data: { state: 'DECLINED' },
        });
        await tx.task.update({
          where: { id: fresh.taskId },
          data: {
            status: 'ASSIGNED',
            providerId: fresh.providerId,
            finalPriceCents: fresh.amountCents,
            assignedAt: new Date(),
          },
        });
        await tx.taskEvent.create({
          data: {
            taskId: fresh.taskId,
            actorId: session.sub,
            fromStatus: 'OPEN',
            toStatus: 'ASSIGNED',
            meta: { offerId: fresh.id, amountCents: fresh.amountCents },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'OFFER_CLOSED' || msg === 'TASK_TAKEN') {
      fail(409, 'CONFLICT', 'This task was just taken — refresh to see the latest state');
    }
    throw e;
  }
  // Tell both sides (with push) + every out-bid buddy (their sibling offer just closed).
  const price = `S$${(offer.amountCents / 100).toFixed(2)}`;
  await notifyUser({
    userId: offer.providerId,
    type: 'offer.accepted',
    title: `Deal! You got “${offer.task.title}” at ${price} 🤝`,
    taskId: offer.taskId,
  });
  await notifyUser({
    userId: offer.task.customerId,
    type: 'task.assigned',
    title: `“${offer.task.title}” is assigned at ${price}`,
    taskId: offer.taskId,
  });
  const siblings = await db().offer.findMany({
    where: { taskId: offer.taskId, id: { not: offer.id } },
    select: { providerId: true },
  });
  for (const s of siblings) publishToUser(s.providerId, { kind: 'task', taskId: offer.taskId });
  publishToCampus(session.campusId, { kind: 'task', taskId: offer.taskId }); // gone from every Explore
  return ok({ accepted: true, taskId: offer.taskId });
});
