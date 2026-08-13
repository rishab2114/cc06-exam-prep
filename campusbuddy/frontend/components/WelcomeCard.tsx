'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { Search, Handshake, CircleCheck } from 'lucide-react';

const STEPS = [
  { icon: Search, title: 'Browse', body: 'See what students near you need right now — laundry, parcels, meals, study help.' },
  { icon: Handshake, title: 'Offer or accept', body: 'Quote your own price, or just take theirs. Either side can counter until you agree.' },
  { icon: CircleCheck, title: 'Get it done', body: 'Coordinate in chat, do the task, then rate each other. Free to post, always.' },
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
    <div className="relative rounded-2xl border border-blue-100 bg-brand-soft p-4">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-subtle hover:text-muted"
      >
        ✕
      </button>
      <p className="pr-6 font-semibold text-brand-hover">Welcome to CampusBuddy — here&apos;s how it works</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl bg-surface p-3">
            <s.icon size={18} className="text-brand" aria-hidden="true" />
            <p className="mt-1 text-sm font-medium">{s.title}</p>
            <p className="mt-0.5 text-xs text-muted">{s.body}</p>
          </div>
        ))}
      </div>
      <button onClick={dismiss} className="mt-3 text-sm font-medium text-brand">
        Got it, let's go ›
      </button>
    </div>
  );
}
