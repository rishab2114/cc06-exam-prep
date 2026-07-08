import { z } from 'zod';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';
import { publishToUser } from '../../../../../../lib/server/events';
import { rateLimit } from '../../../../../../lib/server/rateLimit';
import { notifyUser } from '../../../../../../lib/server/notify';

// Task chat: customer ↔ assigned buddy, opens once the deal is made. Before
// that, offer messages carry the pre-deal context. Campus-scoped like
// everything else.
async function chatTask(taskId: string, campusId: string, viewerId: string) {
  const task = await db().task.findFirst({
    where: { id: taskId, campusId, deletedAt: null },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  if (viewerId !== task.customerId && viewerId !== task.providerId) {
    fail(403, 'FORBIDDEN', 'Only the poster and their buddy can chat here');
  }
  if (!task.providerId) fail(409, 'NO_CHAT', 'Chat opens once you accept a buddy');
  return task;
}

// GET — the thread, oldest first. Reading marks the other side's messages read.
export const GET = handler(async (_req, { params, session }) => {
  const task = await chatTask(params.id, session.campusId, session.sub);

  const messages = await db().message.findMany({
    where: { taskId: task.id, deletedAt: null },
    include: { sender: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  await db().message.updateMany({
    where: { taskId: task.id, senderId: { not: session.sub }, readAt: null },
    data: { readAt: new Date() },
  });
  return ok({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.fullName,
      body: m.body,
      at: m.createdAt.getTime(),
      mine: m.senderId === session.sub,
    })),
  });
});

const Body = z.object({ body: z.string().trim().min(1).max(1000) });

// POST — send a message. The counterparty gets at most one unread chat
// notification per task, so rapid-fire messages don't flood their bell.
export const POST = handler(async (req, { params, session }) => {
  const { body } = await parseBody(req, Body);
  rateLimit(`message:create:${session.sub}`, 60, 60_000);
  const task = await chatTask(params.id, session.campusId, session.sub);

  const message = await db().message.create({
    data: { taskId: task.id, senderId: session.sub, body },
  });

  const counterparty = session.sub === task.customerId ? task.providerId! : task.customerId;
  const alreadyPinged = await db().notification.findFirst({
    where: {
      userId: counterparty,
      type: 'message.new',
      readAt: null,
      data: { path: ['taskId'], equals: task.id },
    },
  });
  if (!alreadyPinged) {
    // notifyUser also fires web push — exactly what you want for a first
    // unread message; the chat-kind publish below covers live re-renders for
    // every message after that, pinged or not.
    await notifyUser({
      userId: counterparty,
      type: 'message.new',
      title: `${session.name} messaged you about “${task.title}”`,
      taskId: task.id,
    });
  }
  publishToUser(counterparty, { kind: 'chat', taskId: task.id });
  return ok(
    {
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: session.name,
        body: message.body,
        at: message.createdAt.getTime(),
        mine: true,
      },
    },
    201,
  );
});
