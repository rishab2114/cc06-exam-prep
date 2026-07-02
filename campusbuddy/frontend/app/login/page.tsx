'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isCampusEmail, campusForEmail, CAMPUSES } from '../../lib/ntu';
import { api, ApiClientError } from '../../lib/api';

// Sign-in / sign-up entry. The campus email gate is checked here for fast
// feedback and enforced again server-side (the API refuses non-campus domains).
// On success the server emails a 6-digit code and we move to /verify.
export default function LoginPage() {
  const router = useRouter();
  const [campus, setCampus] = useState(CAMPUSES[0].code); // default to launch campus
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
        Only verified students can join. Accounts are verified by campus email + matric card.
      </p>
    </main>
  );
}
