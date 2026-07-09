import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail } from '../../../../../../lib/server/http';
import { taskToDto } from '../../../../../../lib/server/serialize';
import { publishToUser } from '../../../../../../lib/server/events';
import { rateLimit } from '../../../../../../lib/server/rateLimit';
import { notifyUser } from '../../../../../../lib/server/notify';

// POST /api/v1/tasks/[id]/book — book a freelance gig (a kind=OFFER listing).
// Rather than invert the whole customer/provider machine for gigs, booking
// spins up a normal REQUEST owned by the booker with a pending offer already on
// the table from the gig owner. From there the existing accept → chat →
// complete → review flow runs unchanged: the booker just accepts (or bargains).
export const POST = handler(async (_req, { params, session }) => {
  rateLimit(`gig:book:${session.sub}`, 15, 60_000);

  const gig = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId, kind: 'OFFER', deletedAt: null },
  });
  if (!gig) fail(404, 'NOT_FOUND', 'Gig not found');
  if (gig.status !== 'OPEN') fail(409, 'NOT_OPEN', 'This gig is no longer available');
  if (gig.customerId === session.sub) fail(403, 'OWN_GIG', 'You cannot book your own gig');

  // Idempotent: if you already have a live booking of this gig, return it
  // instead of stacking duplicates (double-tap, back button, refresh).
  const existing = await db().task.findFirst({
    where: {
      sourceGigId: gig.id,
      customerId: session.sub,
      status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
    },
    include: { category: true, customer: true, offers: { select: { id: true } } },
  });
  if (existing) return ok({ task: taskToDto(existing, session.sub), reused: true }, 200);

  const booking = await db().$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        campusId: gig.campusId,
        customerId: session.sub,
        categoryId: gig.categoryId,
        kind: 'REQUEST',
        sourceGigId: gig.id,
        title: gig.title,
        description: gig.description,
        hall: gig.hall,
        whenText: gig.whenText,
        budgetCents: gig.budgetCents,
        status: 'OPEN',
        events: { create: { actorId: session.sub, toStatus: 'OPEN' } },
      },
      include: { category: true, customer: true, offers: { select: { id: true } } },
    });
    // The gig owner's standing rate lands as a pending offer, so the booker sees
    // a quote to accept and the owner sees it in "Your offers" straight away.
    const offer = await tx.offer.create({
      data: {
        taskId: task.id,
        providerId: gig.customerId,
        amountCents: gig.budgetCents,
        state: 'PENDING',
        lastActor: 'PROVIDER',
        message: 'Booked from your gig — accept to lock it in.',
      },
    });
    return { task, offerId: offer.id };
  });

  await notifyUser({
    userId: gig.customerId,
    type: 'gig.booked',
    title: `${session.name} booked your gig “${gig.title}”`,
    body: 'Open the request to chat and get started.',
    taskId: booking.task.id,
    offerId: booking.offerId,
  });
  // Booker's own dashboards refresh to show the new request + pending offer.
  publishToUser(session.sub, { kind: 'task', taskId: booking.task.id });

  return ok({ task: taskToDto(booking.task, session.sub), reused: false }, 201);
});
