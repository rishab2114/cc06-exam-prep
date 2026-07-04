import { db } from '../../../../lib/server/db';
import { handler, ok } from '../../../../lib/server/http';

// Reads the session cookie — never prerender.
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { session }) => {
  const rows = await db().notification.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok({
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: n.readAt !== null,
      at: n.createdAt.getTime(),
    })),
    unread: rows.filter((n) => n.readAt === null).length,
  });
});
