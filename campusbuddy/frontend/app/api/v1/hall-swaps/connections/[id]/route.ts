import { z } from 'zod';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';
import { notifyUser } from '../../../../../../lib/server/notify';

const Body = z.object({ action: z.enum(['ACCEPT', 'DECLINE']) });

export const POST = handler(async (req, { params, session }) => {
  const { action } = await parseBody(req, Body);
  const connection = await db().hallSwapConnection.findUnique({ where: { id: params.id } });
  if (!connection || connection.recipientId !== session.sub || connection.campusId !== session.campusId) {
    fail(404, 'NO_REQUEST', 'That introduction request is no longer available');
  }
  if (connection.status !== 'PENDING') fail(409, 'ALREADY_HANDLED', 'That request has already been handled');

  const updated = await db().hallSwapConnection.update({
    where: { id: connection.id },
    data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' },
  });
  if (action === 'ACCEPT') {
    await notifyUser({
      userId: connection.requesterId,
      type: 'hall_swap.intro_accepted',
      title: 'Your hall-swap introduction was accepted',
      body: 'You can now contact each other and submit the official NTU swap requests.',
      href: '/app/hall-swap',
    });
  }
  return ok({ connectionId: updated.id, status: updated.status });
});
