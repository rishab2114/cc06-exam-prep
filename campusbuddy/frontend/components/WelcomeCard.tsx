'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';

const STEPS = [
  { icon: '🔎', title: 'Browse', body: 'See what students near you need right now — laundry, parcels, meals, study help.' },
  { icon: '🤝', title: 'Offer or accept', body: 'Quote your own price, or just take theirs. Either side can counter until you agree.' },
  { icon: '✅', title: 'Get it done', body: 'Coordinate in chat, do the task, then rate each other. Free to post, always.' },
];

function storageKey(userId: string) {
  return `cb.welcomeDismissed.${userId}`;
}

// Dismissible first-run "how it works" card. Shown to new signups landing on
// Explore (?welcome=1) and to anyone who hasn't dismissed it yet for their
// account; persisted per-user in localStorage so switching demo accounts
// shows it again for the "new" identity.
export function WelcomeCard({ forceShow }: { forceShow: boolean }) {
  const { me } = useStore();
  const [dismissed, setDismissed] = useState(true); // default hidden until we check storage

  useEffect(() => {
    if (!me) return;
    const stored = localStorage.getItem(storageKey(me.id));
    setDismissed(!forceShow && stored === '1');
  }, [me, forceShow]);

  if (!me || dismissed) return null;

  function dismiss() {
    if (me) localStorage.setItem(storageKey(me.id), '1');
    setDismissed(true);
  }

  return (
    <div className="relative rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
      >
        ✕
      </button>
      <p className="pr-6 font-semibold text-blue-900">👋 Welcome to CampusBuddy — here's how it works</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl bg-white p-3">
            <p className="text-xl">{s.icon}</p>
            <p className="mt-1 text-sm font-medium">{s.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.body}</p>
          </div>
        ))}
      </div>
      <button onClick={dismiss} className="mt-3 text-sm font-medium text-blue-700">
        Got it, let's go ›
      </button>
    </div>
  );
}
