'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiClientError } from '../../lib/api';

// Step 2 of sign-in: type the 6-digit code from your inbox. First-time users can
// set their display name in the same step. In dev (no email provider) the code
// is surfaced on-screen so the flow stays fully testable.
function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = (params.get('email') ?? '').trim().toLowerCase();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    setDevCode(sessionStorage.getItem('cb.devCode'));
  }, []);

  if (!email) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
        <p className="text-slate-600">Start from the sign-in page so we know where to send your code.</p>
        <Link href="/login" className="mt-4 font-medium text-blue-700">Go to sign in ›</Link>
      </main>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { isNewUser } = await api.verify(email, code, name.trim() || undefined);
      sessionStorage.removeItem('cb.devCode');
      // First-timers land on live inventory (proof the marketplace is active)
      // instead of an empty personal dashboard; returning users go straight home.
      router.replace(isNewUser ? '/app/find?welcome=1' : '/app');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not reach the server — try again.');
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setResent(false);
    try {
      const res = await api.requestCode(email);
      if (res.devCode) {
        sessionStorage.setItem('cb.devCode', res.devCode);
        setDevCode(res.devCode);
      }
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not resend — try again.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <div className="text-4xl">📬</div>
      <h1 className="mt-4 text-2xl font-bold">Check your inbox</h1>
      <p className="mt-2 text-slate-600">
        We sent a 6-digit code to <span className="font-medium">{email}</span>. It expires in 10
        minutes.
      </p>

      {devCode && (
        <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Dev build — email isn&apos;t connected. Your code: <b className="tracking-widest">{devCode}</b>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-3 text-left">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
          autoFocus
        />
        <label className="block text-sm">
          <span className="text-slate-500">Your name (shown to other students — optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="e.g. Priya S"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {resent && <p className="text-sm text-green-700">New code sent ✓</p>}
        <button
          disabled={busy || code.length !== 6}
          className="block w-full rounded-xl bg-blue-700 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Verifying…' : 'Verify & sign in'}
        </button>
      </form>

      <button onClick={resend} className="mt-4 text-sm text-blue-700">
        Resend code
      </button>
      <Link href="/login" className="mt-2 text-sm text-slate-500">
        Use a different email
      </Link>
    </main>
  );
}

export default function VerifyPage() {
  // useSearchParams must sit inside a Suspense boundary for static rendering.
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
