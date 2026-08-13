import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';

export const POST = handler(async (_req, { session }) => {
  await db().notification.updateMany({
    where: { userId: session.sub, readAt: null },
    data: { readAt: new Date() },
  });
  return ok({ ok: true });
});
