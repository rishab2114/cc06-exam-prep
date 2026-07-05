'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../../lib/store';
import { api } from '../../../lib/api';

// Profile — the signed-in user. Ratings, job counts, and services offered
// arrive with the reviews + provider-profile work; identity and verification
// state are real today.
const SETTINGS = [
  { label: 'Edit profile', icon: '✏️', body: 'Change your name, hall, and services offered. Coming soon.' },
  { label: 'Notifications', icon: '🔔', body: 'Choose push/email alerts for offers, deals, and payouts. Coming soon.' },
  { label: 'Safety & SOS', icon: '🛟', body: 'In an emergency, call Campus Security or 999. In-app SOS + live-location share is coming soon.' },
  { label: 'Help & support', icon: '❓', body: 'Reach us at hello@campusbuddy.sg — we reply within a day.' },
];

export default function ProfilePage() {
  const { me, myTasks, signOut } = useStore();
  const [demoAccounts, setDemoAccounts] = useState<{ email: string; name: string }[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  // Dev-only: lets you jump straight to another seeded student without signing
  // out first, so you can drive both sides of a deal fast. Empty in production.
  useEffect(() => {
    api.devAccounts().then((r) => setDemoAccounts(r.accounts)).catch(() => setDemoAccounts([]));
  }, []);

  async function switchTo(email: string) {
    if (switching) return;
    setSwitching(email);
    try {
      await api.devLogin(email);
      window.location.href = '/app'; // hard reload so the store re-hydrates as the new user
    } catch {
      setSwitching(null);
    }
  }

  if (!me) return null; // store redirects to /login before this renders

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">Profile</header>

      <div className="space-y-4 p-4">
        {/* Identity card */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {me.name[0]?.toUpperCase() ?? '🎒'}
            </div>
            <div>
              <p className="text-lg font-semibold">{me.name}</p>
              <p className="text-sm text-slate-500">{me.campus}{me.hall ? ` · ${me.hall}` : ''}</p>
              <p className="text-xs text-slate-400">{me.email}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              🎓 {me.campus} email verified
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              🪪 Matric scan — at first in-person task
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">{myTasks.length}</p>
            <p className="text-xs text-slate-500">Active posts</p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">{me.jobsDone}</p>
            <p className="text-xs text-slate-500">Jobs done</p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">{me.rating !== null ? `⭐${me.rating}` : '⭐ New'}</p>
            <p className="text-xs text-slate-500">Rating</p>
          </div>
        </div>

        {/* Settings */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Settings</p>
          <div className="divide-y rounded-xl border bg-white">
            {SETTINGS.map((s) => (
              <details key={s.label} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                  <span>{s.icon} {s.label}</span>
                  <span className="text-slate-300 transition group-open:rotate-90">›</span>
                </summary>
                <p className="mt-2 text-sm text-slate-500">{s.body}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Dev-only fast identity switch for driving both sides of the marketplace */}
        {demoAccounts.filter((a) => a.email !== me.email).length > 0 && (
          <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">🧪 Switch demo account (dev)</p>
            <p className="mt-1 text-xs text-amber-700">
              Jump to another student to offer, bargain, or accept from the other side.
            </p>
            <div className="mt-3 space-y-2">
              {demoAccounts
                .filter((a) => a.email !== me.email)
                .map((a) => (
                  <button
                    key={a.email}
                    onClick={() => void switchTo(a.email)}
                    disabled={switching !== null}
                    className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    <span>{a.name}</span>
                    <span className="text-blue-700">{switching === a.email ? 'Switching…' : 'Switch ›'}</span>
                  </button>
                ))}
            </div>
          </section>
        )}

        <button
          onClick={() => void signOut()}
          className="block w-full rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-600"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
