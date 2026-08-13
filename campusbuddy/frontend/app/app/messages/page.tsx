'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, type MessageThread } from '../../../lib/api';
import { useStore } from '../../../lib/store';

// Messages inbox — every task chat you're part of, newest activity first, with
// a preview and unread count per thread. The chat itself still lives on the
// task page (it needs the task context around it); this is purely "which
// conversations do I have and which need a reply."
function timeAgo(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

export default function MessagesPage() {
  const { me, subscribe } = useStore();
  const [threads, setThreads] = useState<MessageThread[] | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.messageThreads();
      setThreads(r.threads);
    } catch {
      /* keep showing whatever we had */
    }
  }, []);

  useEffect(() => {
    void load();
    const off = subscribe((ev) => {
      if (ev.kind === 'chat' || ev.kind === 'task') void load();
    });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 30_000);
    return () => {
      off();
      clearInterval(timer);
    };
  }, [load, subscribe]);

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-surface px-4 py-3 font-semibold">Messages</header>

      <div className="divide-y">
        {threads === null && (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border bg-surface" />
            ))}
          </div>
        )}

        {threads?.map((t) => (
          <Link
            key={t.taskId}
            href={t.taskStatus === 'OPEN' ? `/app/applicants/${t.taskId}` : `/app/task/${t.taskId}`}
            className="flex items-start gap-3 bg-surface px-4 py-3"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
              {t.counterpartName[0]?.toUpperCase() ?? '💬'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${t.unread > 0 ? 'font-semibold' : 'font-medium'}`}>
                  {t.counterpartName}
                </span>
                <span className="shrink-0 text-xs text-subtle">{timeAgo(t.lastMessageAt)}</span>
              </div>
              <p className="truncate text-xs text-subtle">{t.taskTitle}</p>
              <p className={`mt-0.5 truncate text-sm ${t.unread > 0 ? 'font-medium text-text' : 'text-muted'}`}>
                {t.lastMessageMine ? 'You: ' : ''}
                {t.lastMessage ?? 'Say hi 👋'}
              </p>
            </div>
            {t.unread > 0 && (
              <span className="mt-1 shrink-0 rounded-full bg-danger px-1.5 text-[10px] font-bold leading-4 text-white">
                {t.unread > 9 ? '9+' : t.unread}
              </span>
            )}
          </Link>
        ))}

        {threads?.length === 0 && (
          <div className="bg-surface p-8 text-center text-sm text-muted">
            <p className="text-3xl">💬</p>
            <p className="mt-2 font-medium text-text">No conversations yet</p>
            <p className="mt-1">
              {me ? 'Chat opens automatically once you accept or get accepted on a task.' : ''}
            </p>
            <Link href="/app/find" className="mt-3 block font-medium text-brand">Browse tasks ›</Link>
          </div>
        )}
      </div>
    </div>
  );
}
