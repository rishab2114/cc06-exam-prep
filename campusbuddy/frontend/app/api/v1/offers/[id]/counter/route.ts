import { z } from 'zod';
import { OfferState, OfferActor, canAct, assertOfferTransition } from '@campusbuddy/shared';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';
import { offerToDto } from '../../../../../../lib/server/serialize';
import { publishToUser } from '../../../../../../lib/server/events';

const Body = z.object({ amountCents: z.number().int().min(1).max(99900) });

// POST /api/v1/offers/:id/counter — turn-taking bargaining. Only the side that
// did NOT move last may counter (enforced by the shared state machine).
export const POST = handler(async (req, { params, session }) => {
  const { amountCents } = await parseBody(req, Body);
  const offer = await db().offer.findUnique({
    where: { id: params.id },
    include: { task: true, provider: true },
  });
  if (!offer || offer.task.campusId !== session.campusId) fail(404, 'NOT_FOUND', 'Offer not found');

  const side =
    session.sub === offer.task.customerId
      ? OfferActor.CUSTOMER
      : session.sub === offer.providerId
        ? OfferActor.PROVIDER
        : null;
  if (!side) fail(403, 'FORBIDDEN', 'Not your negotiation');
  if (!canAct('counter', offer.state as OfferState, offer.lastActor as OfferActor, side)) {
    fail(409, 'NOT_YOUR_TURN', 'Waiting for the other side to respond');
  }
  assertOfferTransition(offer.state as OfferState, OfferState.COUNTERED);

  const updated = await db().offer.update({
    where: { id: offer.id },
    data: { amountCents, state: 'COUNTERED', lastActor: side, round: offer.round + 1 },
    include: { provider: true },
  });

  const counterparty = side === OfferActor.CUSTOMER ? offer.providerId : offer.task.customerId;
  await db().notification.create({
    data: {
      userId: counterparty,
      type: 'offer.countered',
      title: `${session.name} countered at S$${(amountCents / 100).toFixed(2)}`,
      body: `On “${offer.task.title}” — your move.`,
      data: { taskId: offer.taskId, offerId: offer.id },
    },
  });
  publishToUser(counterparty, { kind: 'task', taskId: offer.taskId });
  return ok({ offer: offerToDto(updated, session.sub, offer.task.customerId) });
});
