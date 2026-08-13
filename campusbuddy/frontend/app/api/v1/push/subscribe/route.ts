import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, parseBody } from '../../../../../lib/server/http';

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

// POST /api/v1/push/subscribe — register this browser/device for Web Push.
// Upsert on (userId, endpoint) so re-subscribing (e.g. permission re-granted)
// doesn't create duplicate rows.
export const POST = handler(async (req, { session }) => {
  const { endpoint, keys } = await parseBody(req, Body);
  await db().pushSubscription.upsert({
    where: { userId_endpoint: { userId: session.sub, endpoint } },
    update: { keys },
    create: { userId: session.sub, endpoint, keys },
  });
  return ok({ subscribed: true });
});

const DeleteBody = z.object({ endpoint: z.string().url() });

// DELETE /api/v1/push/subscribe — turn push off for this device.
export const DELETE = handler(async (req, { session }) => {
  const { endpoint } = await parseBody(req, DeleteBody);
  await db().pushSubscription.deleteMany({ where: { userId: session.sub, endpoint } });
  return ok({ subscribed: false });
});
