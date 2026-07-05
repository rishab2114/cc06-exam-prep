import { OfferState, OfferActor, canAct, assertOfferTransition } from '@campusbuddy/shared';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../../lib/server/http';
import { publishToUser } from '../../../../../../lib/server/events';

// POST /api/v1/offers/:id/withdraw — the provider pulls their own offer out of a
// live negotiation (before it's accepted). Terminal: PENDING/COUNTERED → WITHDRAWN.
export const POST = handler(async (_req, { params, session }) => {
  const offer = await db().offer.findUnique({
    where: { id: params.id },
    include: { task: true },
  });
  if (!offer || offer.task.campusId !== session.campusId) fail(404, 'NOT_FOUND', 'Offer not found');
  if (offer.providerId !== session.sub) fail(403, 'FORBIDDEN', 'Only the buddy who made this offer can withdraw it');
  if (!canAct('withdraw', offer.state as OfferState, offer.lastActor as OfferActor, OfferActor.PROVIDER)) {
    fail(409, 'OFFER_CLOSED', 'This offer is already closed');
  }
  assertOfferTransition(offer.state as OfferState, OfferState.WITHDRAWN);

  await db().offer.update({ where: { id: offer.id }, data: { state: 'WITHDRAWN' } });
  await db().notification.create({
    data: {
      userId: offer.task.customerId,
      type: 'offer.withdrawn',
      title: `${session.name} withdrew their offer on “${offer.task.title}”`,
      data: { taskId: offer.taskId },
    },
  });
  publishToUser(offer.task.customerId, { kind: 'task', taskId: offer.taskId });
  return ok({ withdrawn: true });
});
