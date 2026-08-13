'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, FlaskConical, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { isCampusEmail, campusForEmail, CAMPUSES } from '../../lib/ntu';
import { api, ApiClientError } from '../../lib/api';

interface DemoAccount {
  email: string;
  name: string;
  campus: string;
  hall: string | null;
  isDemo?: boolean;
}

type Mode = 'signin' | 'signup';

// Sign in / create account with a campus email + password. The campus gate is
// checked here for fast feedback and enforced again server-side.
//
// Note this is a DOMAIN check — it proves the address belongs to a university we
// support, not that this person owns it. Confirming ownership needs an emailed
// code, which this deployment can't send yet, so we don't claim these accounts
// are "verified" anywhere in the UI.
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [campus, setCampus] = useState((CAMPUSES.find((c) => c.code === 'NTU') ?? CAMPUSES[0]).code);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);

  useEffect(() => {
    api
      .devAccounts()
      .then((r) => setDemoAccounts(r.accounts))
      .catch(() => setDemoAccounts([]));
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

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
    if (busy) return;
    const cleaned = email.trim().toLowerCase(); // paste-with-spaces & caps happen constantly

    if (!isCampusEmail(cleaned)) {
      setError('Please use your university email (e.g. yourname@e.ntu.edu.sg).');
      return;
    }
    if (mode === 'signup') {
      if (campusForEmail(cleaned)?.code !== campus) {
        setError(`That email doesn't look like a ${campus} address — pick the matching campus.`);
        return;
      }
      if (!name.trim()) {
        setError('Add your name so people know who they’re dealing with.');
        return;
      }
    }

    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') await api.register(cleaned, password, name.trim());
      else await api.login(cleaned, password);
      router.replace(mode === 'signup' ? '/app/find?welcome=1' : '/app');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not reach the server — try again.');
      setBusy(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        ‹ Back
      </Link>

      <div className="card mt-5 p-6 shadow-card sm:p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {isSignup
            ? 'Join with your university email and pick a password.'
            : 'Sign in with your university email and password.'}
        </p>

        {/* Mode switch */}
        <div
          role="tablist"
          aria-label="Sign in or create an account"
          className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-sunken p-1"
        >
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors duration-150 ${
                mode === m ? 'bg-surface text-text shadow-card' : 'text-muted hover:text-text'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {isSignup && (
            <>
              <label className="block text-sm">
                <span className="font-medium">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Priya S"
                  autoComplete="name"
                  className="input mt-1.5"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium">Your campus</span>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="input mt-1.5 appearance-none bg-[right_1rem_center] bg-no-repeat pr-10"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                  }}
                >
                  {CAMPUSES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="font-medium">Campus email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@e.ntu.edu.sg"
              autoComplete="email"
              className="input mt-1.5"
              aria-invalid={error ? true : undefined}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Password</span>
            <span className="relative mt-1.5 block">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-text"
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
            {isSignup && (
              <span className="mt-1.5 block text-xs text-subtle">
                At least 8 characters, with a letter and a number.
              </span>
            )}
          </label>

          {/* Rule 8: the error sits with the fields it belongs to, not at the top. */}
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button disabled={busy} className="btn btn-primary w-full">
            {busy
              ? isSignup
                ? 'Creating account…'
                : 'Signing in…'
              : isSignup
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 flex items-start gap-2 text-xs text-subtle">
          <ShieldCheck size={14} className="mt-px shrink-0 text-brand" aria-hidden="true" />
          Only university email addresses can join — we check the domain when you sign up.
        </p>
      </div>

      {demoAccounts.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-text">
            <FlaskConical size={15} aria-hidden="true" />
            Or look around as a demo student
          </p>
          <p className="mt-1 text-xs text-accent-text">
            One tap, no account needed. Sign in as one to post a task, switch to another to offer and
            bargain, then back to accept. These are sample accounts, not real students.
          </p>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
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
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {a.campus}
                    {a.hall ? ` · ${a.hall}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-0.5 pl-2 text-sm font-medium text-brand">
                  {demoBusy === a.email ? 'Opening…' : 'Try it'}
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
