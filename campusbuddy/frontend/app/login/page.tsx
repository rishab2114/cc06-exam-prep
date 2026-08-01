'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isCampusEmail, campusForEmail, CAMPUSES } from '../../lib/ntu';
import { api, ApiClientError } from '../../lib/api';
import { Sparkles, ShieldCheck, FlaskConical, ChevronRight } from 'lucide-react';

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
  // Default to the launch campus (NTU); fall back to the first registry entry.
  const [campus, setCampus] = useState((CAMPUSES.find((c) => c.code === 'NTU') ?? CAMPUSES[0]).code);
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
      setError('Please use your university email (e.g. yourname@e.ntu.edu.sg).');
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        ‹ Back
      </Link>

      <div className="mt-5 card p-6 shadow-card sm:p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Welcome to CampusBuddy</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Sign in or join with your campus email. We&apos;ll send you a 6-digit code — no password.
        </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <label className="block text-sm">
          <span className="font-medium">Your campus</span>
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="input mt-1.5 appearance-none bg-[right_1rem_center] bg-no-repeat pr-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
          >
            {CAMPUSES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Campus email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yourname@e.ntu.edu.sg"
            className="input mt-1.5"
            aria-invalid={error ? true : undefined}
          />
        </label>
        {/* Rule 8: the error sits with the field it belongs to, not at the top. */}
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button disabled={sending} className="btn btn-primary w-full">
          {sending ? 'Sending code…' : 'Send sign-in code'}
        </button>
      </form>

      <p className="mt-5 flex items-start gap-2 text-xs text-subtle">
        <ShieldCheck size={14} className="mt-px shrink-0 text-brand" aria-hidden="true" />
        Only verified students can join — we check your university email.
      </p>
      </div>

      {demoAccounts.length > 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-text">
            <FlaskConical size={15} aria-hidden="true" />
            Try it as a demo student
          </p>
          <p className="mt-1 text-xs text-accent-text">
            One tap to explore the marketplace as a sample NTU student — no email code needed. Sign
            in as one to post a task, switch to another to offer and bargain, then back to accept.
            These are sample accounts, not real students.
          </p>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                onClick={() => demoLogin(a.email)}
                disabled={demoBusy !== null}
                className="flex min-h-[52px] w-full items-center justify-between rounded-xl border border-accent/30 bg-surface px-3 py-2.5 text-left transition-colors duration-150 hover:border-accent/60 disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{a.name}</span>
                    {a.isDemo && (
                      <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-text">
                        demo
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {a.email} · {a.campus}{a.hall ? ` · ${a.hall}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-0.5 pl-2 text-sm font-medium text-brand">
                  {demoBusy === a.email ? 'Signing in…' : 'Sign in'}
                  {demoBusy !== a.email && <ChevronRight size={14} aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
