import webpush from 'web-push';
import { db } from './db';

/**
 * Web Push delivery. Configured lazily so a missing VAPID key never breaks a
 * build or a request that doesn't need push — sendPushToUser() just no-ops.
 * Dead subscriptions (410 Gone / 404) are pruned as they're discovered.
 */
let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@campusbuddy.sg', publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body?: string;
  taskId?: string;
}

/** Best-effort push to every device the user has subscribed. Never throws. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await db().pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify({ title: payload.title, body: payload.body, taskId: payload.taskId });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys as unknown as { p256dh: string; auth: string } },
          body,
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription is dead (browser unsubscribed / expired) — clean it up.
          await db().pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
        // Any other error (offline device, transient) — swallow; push is best-effort.
      }
    }),
  );
}
