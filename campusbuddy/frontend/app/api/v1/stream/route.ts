import { getSession } from '../../../../lib/server/auth';
import { subscribeUser } from '../../../../lib/server/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/v1/stream — Server-Sent Events for the signed-in user. The browser's
// EventSource authenticates via the session cookie automatically. We stream
// nudges from the in-process bus and send a heartbeat comment so proxies keep
// the connection open; on disconnect we unsubscribe.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response('Sign in required', { status: 401 });

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* controller closed — cleanup runs via cancel()/abort */
        }
      };

      send('retry: 3000\n\n'); // client auto-reconnect backoff
      send('event: ready\ndata: {}\n\n');

      unsubscribe = subscribeUser(session.sub, (ev) => send(`data: ${JSON.stringify(ev)}\n\n`));
      heartbeat = setInterval(() => send(': ping\n\n'), 25_000);

      // Client navigated away / closed the tab.
      req.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable proxy buffering (nginx)
    },
  });
}
