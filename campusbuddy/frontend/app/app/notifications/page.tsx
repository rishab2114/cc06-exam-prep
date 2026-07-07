'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useStore } from '../../../lib/store';

// Notification centre — real events from the API (new offer, counter, deal,
// completion). Each one deep-links to the screen where you act on it. Opening
// the page marks everything read.
function timeAgo(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  'offer.new': '💬',
  'offer.countered': '🔁',
  'offer.accepted': '🤝',
  'task.assigned': '🤝',
  'task.completed': '✅',
  'task.cancelled': '🚫',
  'message.new': '💬',
  'review.new': '⭐',
  'offer.withdrawn': '↩️',
  'offer.declined': '🙅',
  'report.filed': '🚩',
  'task.updated': '✏️',
};

export default function NotificationsPage() {
  const { notifications, markAllRead, myTasks } = useStore();

  useEffect(() => {
    void markAllRead();
  }, [markAllRead]);

  // My own posts route to the offers view; everything else to the task page.
  function hrefFor(taskId?: string): string | null {
    if (!taskId) return null;
    return myTasks.some((t) => t.id === taskId)
      ? `/app/applicants/${taskId}`
      : `/app/task/${taskId}`;
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link> Notifications
      </header>

      <div className="divide-y">
        {notifications.map((n) => {
          const href = hrefFor(n.data?.taskId);
          const inner = (
            <>
              <span className="mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
              <div className="flex-1">
                <p className={`text-sm ${n.read ? 'text-slate-600' : 'font-medium'}`}>{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.at)}</p>
              </div>
              {href && <span className="mt-0.5 text-slate-300">›</span>}
            </>
          );
          return href ? (
            <Link key={n.id} href={href} className="flex items-start gap-3 bg-white px-4 py-3">
              {inner}
            </Link>
          ) : (
            <div key={n.id} className="flex items-start gap-3 bg-white px-4 py-3">
              {inner}
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="bg-white p-8 text-center text-sm text-slate-500">
            <p className="text-3xl">🔔</p>
            <p className="mt-2">Nothing yet — post a task or offer on one and the action lands here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
