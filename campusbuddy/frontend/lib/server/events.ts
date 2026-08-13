import { EventEmitter } from 'events';

/**
 * In-process realtime bus. Every mutation that affects a user publishes a small
 * nudge to that user's channel; the SSE endpoint (/api/v1/stream) relays it and
 * the client refetches the relevant slice. We push *signals*, not payloads —
 * the client already knows how to fetch, so this stays simple and never gets
 * out of sync.
 *
 * Single-instance only, and on serverless that means effectively no-op: each
 * invocation is its own process, so nothing is listening. The client therefore
 * polls /api/v1/sync for change detection instead. These publishes are kept
 * because they are free, they document intent at every mutation site, and they
 * become real the moment this runs on a persistent server (or gets swapped for
 * Redis pub/sub behind the same shape). Kept on globalThis to survive dev HMR.
 */
export interface RealtimeEvent {
  // 'task'  -> a task the user is in changed (offers/status) — refetch feed + that task
  // 'chat'  -> a new message on a task — refetch that thread
  // 'notification' -> only the bell changed
  kind: 'task' | 'chat' | 'notification';
  taskId?: string;
}

const g = globalThis as unknown as { __cbBus?: EventEmitter };
const bus: EventEmitter = g.__cbBus ?? (g.__cbBus = new EventEmitter());
bus.setMaxListeners(0); // one listener per open SSE connection; we clean up on disconnect

export function publishToUser(userId: string, ev: RealtimeEvent): void {
  bus.emit(userId, ev);
}

/**
 * Campus-wide channel: feed-shape changes (task posted / taken / closed) go to
 * everyone on the campus so Explore never shows a task that's already gone.
 */
export function publishToCampus(campusId: string, ev: RealtimeEvent): void {
  bus.emit(`campus:${campusId}`, ev);
}

export function subscribeUser(
  userId: string,
  campusId: string,
  handler: (ev: RealtimeEvent) => void,
): () => void {
  bus.on(userId, handler);
  bus.on(`campus:${campusId}`, handler);
  return () => {
    bus.off(userId, handler);
    bus.off(`campus:${campusId}`, handler);
  };
}
