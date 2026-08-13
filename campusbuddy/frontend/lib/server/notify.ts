import { db } from './db';
import { publishToUser } from './events';
import { sendPushToUser } from './push';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  taskId?: string;
  offerId?: string;
  href?: string;
  meta?: Record<string, string | number | boolean>;
}

/**
 * The one place a user gets told something happened: writes the Notification
 * row (bell/history), pushes the realtime SSE nudge, and fires a best-effort
 * Web Push if they've subscribed on this device. Every mutation that used to
 * do `notification.create` + `publishToUser` by hand now calls this instead,
 * so push coverage is automatic everywhere without touching each call site's
 * business logic.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const data = input.taskId || input.offerId || input.href || input.meta
    ? { ...input.meta, taskId: input.taskId, offerId: input.offerId, href: input.href }
    : undefined;
  await db().notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data,
    },
  });
  publishToUser(input.userId, { kind: 'notification' });
  if (input.taskId) publishToUser(input.userId, { kind: 'task', taskId: input.taskId });
  // Best-effort — never let a push failure affect the API response.
  void sendPushToUser(input.userId, { title: input.title, body: input.body, taskId: input.taskId, href: input.href });
}
