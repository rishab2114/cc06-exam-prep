import { db } from '../../../../lib/server/db';
import { handler, ok } from '../../../../lib/server/http';

export const dynamic = 'force-dynamic';

// GET /api/v1/sync — a tiny "has anything changed for me?" digest.
//
// Realtime can't work the way it does on a single server here: each serverless
// invocation gets its own process, so an in-process event bus never reaches the
// connection holding a stream, and a long-lived SSE response is capped by the
// function timeout anyway. So the client polls this instead — three indexed
// COUNTs, no payload — and only does the expensive refetch when the digest
// actually moves. Cheap enough to call every few seconds per active tab.
export const GET = handler(async (_req, { session }) => {
  const [notifications, messages, openTasks] = await Promise.all([
    db().notification.count({ where: { userId: session.sub, readAt: null } }),
    db().message.count({
      where: {
        readAt: null,
        deletedAt: null,
        senderId: { not: session.sub },
        task: { OR: [{ customerId: session.sub }, { providerId: session.sub }] },
      },
    }),
    db().task.count({ where: { campusId: session.campusId, status: 'OPEN', deletedAt: null } }),
  ]);
  // Opaque to the client — it only checks whether the string changed. `messages`
  // is returned separately so the client can tell a new chat from a feed change
  // and refetch the narrower slice.
  return ok({ v: `${notifications}:${messages}:${openTasks}`, messages });
});
