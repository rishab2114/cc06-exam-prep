'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isCampusEmail, campusForEmail, CAMPUSES } from '../../lib/ntu';
import { api, ApiClientError } from '../../lib/api';

interface DemoAccount {
  email: string;
  name: string;
  campus: string;
  hall: string | null;
  isDemo?: boolean;
}

// Sign-in / sign-up entry. The campus email gate is checked here for fast
// feedback and enforced again server-side (the API refuses non-campus domains).
// On success the server emails a 6-digit code and we move to /verify.
export default function LoginPage() {
  const router = useRouter();
  const [campus, setCampus] = useState(CAMPUSES[0].code); // default to launch campus
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);

  // Dev-only: fetch the seeded demo students for one-tap sign-in. Returns an
  // empty list on any real (email-configured) deployment, so this stays hidden.
  useEffect(() => {
    api
      .devAccounts()
      .then((r) => setDemoAccounts(r.accounts))
      .catch(() => setDemoAccounts([]));
  }, []);

  async function demoLogin(email: string) {
    if (demoBusy) return;
    setDemoBusy(email);
    setError(null);
    try {
      await api.devLogin(email);
      router.replace('/app');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not switch account — try again.');
      setDemoBusy(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const cleaned = email.trim().toLowerCase(); // paste-with-spaces & caps happen constantly
    if (!isCampusEmail(cleaned)) {
      setError('Please use your university email (e.g. yourname@mymail.sutd.edu.sg).');
      return;
    }
    if (campusForEmail(cleaned)?.code !== campus) {
      setError(`That email doesn't look like a ${campus} address — pick the matching campus.`);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await api.requestCode(cleaned);
      // Dev fallback: without an email provider the API returns the code so the
      // flow stays testable end-to-end. Never present in production.
      if (res.devCode) sessionStorage.setItem('cb.devCode', res.devCode);
      else sessionStorage.removeItem('cb.devCode');
      router.push(`/verify?email=${encodeURIComponent(cleaned)}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not reach the server — try again.');
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="text-sm text-slate-500">‹ Back</Link>
      <h1 className="mt-4 text-2xl font-bold text-blue-700">Welcome to CampusBuddy</h1>
      <p className="mt-2 text-slate-600">
        Sign in or join with your campus email. We&apos;ll send you a 6-digit code — no password.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <label className="block text-sm">
          <span className="text-slate-500">Your campus</span>
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            {CAMPUSES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@mymail.sutd.edu.sg"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={sending}
          className="block w-full rounded-xl bg-blue-700 px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {sending ? 'Sending code…' : 'Send sign-in code'}
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-400">
        Only verified students can join. Accounts are verified by your campus email.
      </p>

      {demoAccounts.length > 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">🧪 Switch accounts (dev)</p>
          <p className="mt-1 text-xs text-amber-700">
            One tap to sign in as any account on this server — the seeded demo students plus every
            account you create above with the code flow. Make a couple of accounts, then hop between
            them here to post, offer, and chat across both sides. Newest first.
          </p>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                onClick={() => demoLogin(a.email)}
                disabled={demoBusy !== null}
                className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-left disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{a.name}</span>
                    {a.isDemo && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        demo
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {a.email} · {a.campus}{a.hall ? ` · ${a.hall}` : ''}
                  </span>
                </span>
                <span className="shrink-0 pl-2 text-sm font-medium text-blue-700">
                  {demoBusy === a.email ? 'Signing in…' : 'Sign in ›'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
