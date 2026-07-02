'use client';

import { useStore } from '../../../lib/store';

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
  if (!me) return null; // store redirects to /login before this renders

  return (
    <div>
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
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">{myTasks.length}</p>
            <p className="text-xs text-slate-500">Active posts</p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">⭐ New</p>
            <p className="text-xs text-slate-500">Rating (after first reviews)</p>
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
