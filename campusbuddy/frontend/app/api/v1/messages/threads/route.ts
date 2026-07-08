import { db } from '../../../../../lib/server/db';
import { handler, ok } from '../../../../../lib/server/http';

export const dynamic = 'force-dynamic';

// GET /api/v1/messages/threads — every task chat the caller is part of, one
// row per task, newest activity first, with the last message preview and an
// unread count. Powers the Messages inbox tab so conversations are findable
// without hunting through tasks.
export const GET = handler(async (_req, { session }) => {
  const tasks = await db().task.findMany({
    where: {
      campusId: session.campusId,
      OR: [{ customerId: session.sub }, { providerId: session.sub }],
      messages: { some: {} }, // only tasks where a chat actually started
    },
    include: {
      customer: { select: { id: true, fullName: true } },
      provider: { select: { id: true, fullName: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const unreadCounts = await db().message.groupBy({
    by: ['taskId'],
    where: {
      taskId: { in: tasks.map((t) => t.id) },
      senderId: { not: session.sub },
      readAt: null,
      deletedAt: null,
    },
    _count: { _all: true },
  });
  const unreadByTask = new Map(unreadCounts.map((u) => [u.taskId, u._count._all]));

  const threads = tasks
    .map((t) => {
      const last = t.messages[0];
      const counterpart = t.customerId === session.sub ? t.provider : t.customer;
      return {
        taskId: t.id,
        taskTitle: t.title,
        taskStatus: t.status,
        counterpartName: counterpart?.fullName ?? 'Deleted user',
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.createdAt.getTime() ?? t.createdAt.getTime(),
        lastMessageMine: last?.senderId === session.sub,
        unread: unreadByTask.get(t.id) ?? 0,
      };
    })
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  return ok({ threads, totalUnread: threads.reduce((sum, t) => sum + t.unread, 0) });
});
