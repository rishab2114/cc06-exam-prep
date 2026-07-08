import { api } from './api';

// Client-side Web Push plumbing: register the service worker, subscribe with
// the browser's PushManager, and hand the subscription to the server. Kept
// as plain functions (no React) so it's easy to call from a button handler.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Prompts for notification permission (if needed) and subscribes this device. */
export async function enablePush(): Promise<void> {
  if (!pushSupported()) throw new Error('Push isn’t supported in this browser');
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error('Push isn’t configured on this server yet');

  const reg = await navigator.serviceWorker.register('/sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted');

  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    }));

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error('Subscription is missing keys');
  await api.pushSubscribe({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
}

export async function disablePush(): Promise<void> {
  const sub = await getExistingSubscription();
  if (!sub) return;
  await api.pushUnsubscribe(sub.endpoint);
  await sub.unsubscribe();
}
