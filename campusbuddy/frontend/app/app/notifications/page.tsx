'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useStore } from '../../../lib/store';

// Notification centre. Real events from the store (task posted, deal agreed, …)
// plus seeded examples so the screen is never empty on first open. Opening the
// page marks everything read.
const SEEDED = [
  { id: 's1', text: 'Wei applied to “Room clean” at S$18 — review applicants.', ago: '2h ago' },
  { id: 's2', text: 'Your laundry is being washed 🫧 — track it live.', ago: '3h ago' },
  { id: 's3', text: 'Payout of S$84.00 sent to your bank.', ago: 'Jun 15' },
];

function timeAgo(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { notifications, markAllRead } = useStore();

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">
        <Link href="/app" className="text-slate-500">‹ </Link> Notifications
      </header>

      <div className="divide-y">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 bg-white px-4 py-3">
            <span className="mt-0.5">🔔</span>
            <div className="flex-1">
              <p className="text-sm">{n.text}</p>
              <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.at)}</p>
            </div>
          </div>
        ))}
        {SEEDED.map((n) => (
          <div key={n.id} className="flex items-start gap-3 bg-white px-4 py-3">
            <span className="mt-0.5">🔔</span>
            <div className="flex-1">
              <p className="text-sm text-slate-600">{n.text}</p>
              <p className="mt-0.5 text-xs text-slate-400">{n.ago}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
