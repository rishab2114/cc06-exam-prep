import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';

export const dynamic = 'force-dynamic';

// GET /api/v1/offers/mine — every negotiation the caller has going (or had),
// newest activity first. Powers the "Your offers" dashboard so a buddy never
// has to remember which tasks they offered on.
export const GET = handler(async (_req, { session }) => {
  const offers = await db().offer.findMany({
    where: { providerId: session.sub, task: { campusId: session.campusId } },
    include: { task: { include: { category: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return ok({
    offers: offers.map((o) => {
      const open = o.state === 'PENDING' || o.state === 'COUNTERED';
      return {
        id: o.id,
        taskId: o.taskId,
        taskTitle: o.task.title,
        taskStatus: o.task.status,
        amountCents: o.amountCents,
        round: o.round,
        state: o.state,
        // The provider may act when the other side moved last.
        yourTurn: open && o.lastActor !== 'PROVIDER',
        won: o.state === 'ACCEPTED',
      };
    }),
  });
});
