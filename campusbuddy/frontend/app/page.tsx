'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  MessageSquare,
  Star,
  ArrowRight,
  Sparkles,
  Shirt,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  Luggage,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

// Marketing landing page. Structure follows a standard conversion order —
// value proposition, live proof, how it works, categories, trust, close — so a
// first-time student knows what this is and that it's real within one screen.
const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Sparkles, title: 'Post what you need', body: 'Laundry, a parcel run, an extra home-cooked meal, study help. Takes about 30 seconds, and posting is free.' },
  { icon: MessageSquare, title: 'Agree a price', body: 'Students on your campus offer. Take their price or counter, then confirm the details in chat before anything starts.' },
  { icon: Star, title: 'Get it done, rate each other', body: 'Coordinate in-app, mark it complete, leave a rating. Reputation is what makes the next task easy.' },
];

const CATEGORIES: { icon: LucideIcon; label: string }[] = [
  { icon: Sparkles, label: 'Cleaning' },
  { icon: Shirt, label: 'Laundry' },
  { icon: UtensilsCrossed, label: 'Spare meals' },
  { icon: ShoppingCart, label: 'Grocery runs' },
  { icon: Package, label: 'Parcels' },
  { icon: Luggage, label: 'Moving' },
  { icon: GraduationCap, label: 'Study help' },
];

interface Stats {
  openTasks: number;
  completedTasks: number;
  listedServices: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/v1/public/stats', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
              <Sparkles size={15} aria-hidden="true" />
            </span>
            CampusBuddy
          </span>
          <Link href="/login" className="btn btn-primary !min-h-[40px] !px-4 text-sm">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <span className="badge bg-accent-soft text-accent-text">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              Interactive NTU demo · synthetic data
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight lg:text-[3.25rem]">
              Campus chores, done by
              <span className="text-brand"> students you can trust</span>.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Post a task — laundry, a parcel run, a spare home-cooked meal, last-minute study
              help — and another student on your campus picks it up. No waiting on a friend, no
              owing anyone a favour.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn btn-primary">
                Join with your campus email
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Browse what&apos;s open
              </Link>
            </div>

            <p className="mt-4 max-w-xl rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-text">
              Try a one-tap sample persona or create your own working account. Sample people and
              listings are synthetic; campus-email OTP and in-app payments are not live yet.
            </p>

            {/* Honest demo proof — counts only the synthetic NTU seed. */}
            {stats && (stats.openTasks > 0 || stats.completedTasks > 0 || stats.listedServices > 0) && (
              <dl className="mt-10 flex gap-8 border-t border-border pt-6">
                {[
                  { n: stats.openTasks, l: 'sample tasks' },
                  { n: stats.completedTasks, l: 'sample completed' },
                  { n: stats.listedServices, l: 'sample services' },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="sr-only">{s.l}</dt>
                    <dd>
                      <span className="block text-2xl font-bold text-brand">{s.n}</span>
                      <span className="text-sm text-muted">{s.l}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Product preview — a realistic task card, so the value is concrete. */}
          <div className="mt-14 lg:mt-0">
            <div className="rounded-2xl bg-surface-sunken p-4 shadow-lift sm:p-6">
              <p className="px-1 pb-3 text-xs font-semibold uppercase tracking-wide text-subtle">
                Open near you
              </p>
              <ul className="space-y-3">
                {[
                  { icon: Shirt, title: 'Laundry wash & fold', meta: 'Crescent Hall · Today', price: 'S$10' },
                  { icon: Package, title: 'Collect parcel from hall counter', meta: 'Hall 9 · Before 9pm', price: 'S$5' },
                  { icon: GraduationCap, title: 'MH1810 calculus — exam prep', meta: 'Library · This week', price: 'S$25/hr' },
                ].map((t) => (
                  <li key={t.title} className="card flex items-center gap-3 p-3.5 shadow-card">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <t.icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{t.title}</span>
                      <span className="block truncate text-sm text-muted">{t.meta}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-success">{t.price}</span>
                  </li>
                ))}
              </ul>
              <p className="px-1 pt-3 text-xs text-subtle">Illustrative of a live campus feed.</p>
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="border-y border-border bg-surface-sunken py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">How it works</h2>
            <p className="mt-2 text-muted">
              Three steps. Agree the price in-app; for this demo, students settle directly after the task.
            </p>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="card p-6 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                    <s.icon size={19} aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-semibold">
                    <span className="text-subtle">{i + 1}. </span>
                    {s.title}
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Categories ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">What students post</h2>
          <p className="mt-2 text-muted">
            Or flip it around — list a service you&apos;re good at and get booked.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORIES.map((c) => (
              <li
                key={c.label}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-[15px] font-medium shadow-card"
              >
                <c.icon size={16} className="text-brand" aria-hidden="true" />
                {c.label}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Trust ---------- */}
        <section className="border-t border-border bg-surface-sunken py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5 md:grid md:grid-cols-3 md:gap-8">
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Built for a campus, not the internet
            </h2>
            <ul className="mt-8 space-y-5 md:col-span-2 md:mt-0">
              {[
                { icon: ShieldCheck, t: 'Campus email gate', b: 'The demo checks supported university email domains. Inbox OTP ownership verification is planned before a real pilot.' },
                { icon: MessageSquare, t: 'Agree everything up front', b: 'Price, time and place are settled in chat before work starts — no awkward surprises.' },
                { icon: Star, t: 'Ratings that mean something', b: 'Both sides rate each other after every completed task, and reputation follows you.' },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand shadow-card">
                    <f.icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{f.t}</span>
                    <span className="mt-0.5 block text-[15px] leading-relaxed text-muted">{f.b}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Close ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="rounded-2xl bg-brand px-6 py-14 text-center text-white">
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Something on your list you&apos;d rather not do?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/85">
              Post it free and see what your hall offers. Takes about 30 seconds.
            </p>
            <Link
              href="/login"
              className="btn mt-8 bg-surface text-brand hover:bg-surface/90"
            >
              Get started with your campus email
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CampusBuddy · Built by students, for students</span>
          <span>NTU pilot concept · other campuses configured, not launched</span>
        </div>
      </footer>
    </div>
  );
}
