import { EventEmitter } from 'events';

/**
 * In-process realtime bus. Every mutation that affects a user publishes a small
 * nudge to that user's channel; the SSE endpoint (/api/v1/stream) relays it and
 * the client refetches the relevant slice. We push *signals*, not payloads —
 * the client already knows how to fetch, so this stays simple and never gets
 * out of sync.
 *
 * Single-instance only (dev + one server). At multi-instance scale this bus
 * becomes Redis pub/sub with the exact same publish/subscribe shape — the call
 * sites don't change. Kept on globalThis so it survives Next's dev HMR.
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

export function subscribeUser(userId: string, handler: (ev: RealtimeEvent) => void): () => void {
  bus.on(userId, handler);
  return () => bus.off(userId, handler);
}
