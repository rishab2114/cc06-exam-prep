'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiClientError, type ApiMessage } from '../lib/api';
import { useStore } from '../lib/store';

// Chat between the poster and their buddy — opens once the deal is made, so
// they can coordinate handoff ("bag's outside", "running 5 min late"). Realtime
// via SSE; sends are optimistic so the bubble appears the instant you hit send.
type ChatMessage = ApiMessage & { pending?: boolean };

export function TaskChat({ taskId, counterpartName }: { taskId: string; counterpartName: string }) {
  const { subscribe } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const r = await api.messages(taskId);
      // Keep any still-in-flight optimistic bubbles until their ack replaces them.
      setMessages((prev) => [...r.messages, ...prev.filter((m) => m.pending)]);
    } catch {
      /* poll retries */
    }
  }, [taskId]);

  useEffect(() => {
    void load();
    // Realtime: a new message on this task pushes a 'chat' event to us.
    const off = subscribe((ev) => {
      // No taskId means the change came from the sync digest, which can't say
      // which thread moved — refetch rather than miss a message.
      if ((!ev.taskId || ev.taskId === taskId) && (ev.kind === 'chat' || ev.kind === 'task')) void load();
    });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 30_000); // safety net
    return () => {
      off();
      clearInterval(timer);
    };
  }, [load, subscribe, taskId]);

  useEffect(() => {
    if (messages.length > count.current) {
      bottom.current?.scrollIntoView({ block: 'nearest' });
    }
    count.current = messages.length;
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    // Optimistic: show the bubble immediately, clear the box, reconcile on ack.
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      senderId: 'me',
      senderName: 'You',
      body,
      at: Date.now(),
      mine: true,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setError(null);
    setSending(true);
    try {
      const r = await api.sendMessage(taskId, body);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? r.message : m)));
    } catch (err) {
      // Roll back the bubble and hand the text back so nothing is lost.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft((d) => d || body);
      setError(err instanceof ApiClientError ? err.message : 'Message didn’t send — try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="font-medium">💬 Chat with {counterpartName}</p>

      <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-3 text-center text-xs text-slate-400">
            Say hi and sort out the details — where, when, anything special.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                m.mine ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800'
              } ${m.pending ? 'opacity-60' : ''}`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <form onSubmit={send} className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <button
          disabled={!draft.trim() || sending}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
