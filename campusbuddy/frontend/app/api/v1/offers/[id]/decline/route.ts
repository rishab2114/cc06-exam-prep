import { OfferState, OfferActor, canAct, assertOfferTransition } from '@campusbuddy/shared';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../../lib/server/http';
import { notifyUser } from '../../../../../../lib/server/notify';

// POST /api/v1/offers/:id/decline — the poster dismisses a single offer they
// don't want (e.g. a lowball), without having to accept someone else. Terminal:
// PENDING/COUNTERED → DECLINED. The task stays open for other buddies.
export const POST = handler(async (_req, { params, session }) => {
  const offer = await db().offer.findUnique({
    where: { id: params.id },
    include: { task: true },
  });
  if (!offer || offer.task.campusId !== session.campusId) fail(404, 'NOT_FOUND', 'Offer not found');
  if (offer.task.customerId !== session.sub) fail(403, 'FORBIDDEN', 'Only the task poster can decline an offer');
  if (!canAct('decline', offer.state as OfferState, offer.lastActor as OfferActor, OfferActor.CUSTOMER)) {
    fail(409, 'OFFER_CLOSED', 'This offer is already closed');
  }
  assertOfferTransition(offer.state as OfferState, OfferState.DECLINED);

  await db().offer.update({ where: { id: offer.id }, data: { state: 'DECLINED' } });
  await notifyUser({
    userId: offer.providerId,
    type: 'offer.declined',
    title: `Your offer on “${offer.task.title}” wasn’t taken this time`,
    body: 'Plenty more tasks in Explore — keep offering!',
    taskId: offer.taskId,
  });
  return ok({ declined: true });
});
