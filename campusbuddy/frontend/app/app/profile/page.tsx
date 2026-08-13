'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../../lib/store';
import { api } from '../../../lib/api';
import { disablePush, enablePush, getExistingSubscription, pushSupported } from '../../../lib/push';

// Profile — the signed-in user. Ratings, job counts, and services offered
// arrive with the reviews + provider-profile work; identity and verification
// state are real today.
const SETTINGS = [
  { label: 'Edit profile', icon: '✏️', body: 'Change your name, hall, and services offered. Coming soon.' },
  { label: 'Safety & SOS', icon: '🛟', body: 'In an emergency, call Campus Security or 999. In-app SOS + live-location share is coming soon.' },
  { label: 'Help & support', icon: '❓', body: 'Reach us at hello@campusbuddy.sg — we reply within a day.' },
];

function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(pushSupported());
    getExistingSubscription().then((sub) => setEnabled(!!sub));
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
      } else {
        await enablePush();
        setEnabled(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update push notifications');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">🔔 Push notifications</span>
        {supported ? (
          <button
            onClick={() => void toggle()}
            disabled={busy}
            className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${
              enabled ? 'bg-green-100 text-success' : 'bg-surface-sunken text-muted'
            }`}
          >
            {busy ? '…' : enabled ? 'On — tap to disable' : 'Off — tap to enable'}
          </button>
        ) : (
          <span className="text-xs text-subtle">Not supported here</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        Get an alert on this device for new hall-swap matches, offers, counters, messages, or acceptances.
      </p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

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
      <header className="border-b bg-surface px-4 py-3 font-semibold">Profile</header>

      <div className="space-y-4 p-4">
        {/* Identity card */}
        <div className="rounded-2xl border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-xl font-bold text-brand">
              {me.name[0]?.toUpperCase() ?? '🎒'}
            </div>
            <div>
              <p className="text-lg font-semibold">{me.name}</p>
              <p className="text-sm text-muted">{me.campus}{me.hall ? ` · ${me.hall}` : ''}</p>
              <p className="text-xs text-subtle">{me.email}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-success">
              {me.campus} {me.verifiedAt ? 'email verified' : 'student'}
            </span>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-text">
              🪪 Matric scan — at first in-person task
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-surface p-3">
            <p className="text-lg font-bold">{myTasks.length}</p>
            <p className="text-xs text-muted">Active posts</p>
          </div>
          <div className="rounded-xl border bg-surface p-3">
            <p className="text-lg font-bold">{me.jobsDone}</p>
            <p className="text-xs text-muted">Jobs done</p>
          </div>
          <div className="rounded-xl border bg-surface p-3">
            <p className="text-lg font-bold">{me.rating !== null ? `⭐${me.rating}` : '⭐ New'}</p>
            <p className="text-xs text-muted">Rating</p>
          </div>
        </div>

        {/* Settings */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase text-muted">Settings</p>
          <div className="divide-y rounded-xl border bg-surface">
            <PushToggle />
            {SETTINGS.map((s) => (
              <details key={s.label} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                  <span>{s.icon} {s.label}</span>
                  <span className="text-slate-300 transition group-open:rotate-90">›</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Dev-only fast identity switch for driving both sides of the marketplace */}
        {demoAccounts.filter((a) => a.email !== me.email).length > 0 && (
          <section className="rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4">
            <p className="text-sm font-semibold text-accent-text">🧪 Switch demo account (dev)</p>
            <p className="mt-1 text-xs text-accent-text">
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
                    className="flex w-full items-center justify-between rounded-xl border border-accent/30 bg-surface px-3 py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    <span>{a.name}</span>
                    <span className="text-brand">{switching === a.email ? 'Switching…' : 'Switch ›'}</span>
                  </button>
                ))}
            </div>
          </section>
        )}

        <button
          onClick={() => void signOut()}
          className="block w-full rounded-xl border border-danger/30 bg-surface py-3 text-sm font-medium text-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
