'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// Landing / auth entry. Desktop gets a real two-column hero (not a stretched
// phone column); live stats prove the marketplace is actually running, the
// same trust signal Airbnb/Carousell lead with. Both CTAs land on the same
// magic-code sign-in (there's no separate password flow to split), but read
// distinctly and carry different visual weight — primary for new students,
// a quieter link for returning ones.
const STEPS = [
  { icon: '🔎', title: 'Browse', body: 'See what students near you need — laundry, parcels, meals, study help.' },
  { icon: '🤝', title: 'Offer or accept', body: 'Quote your own price, or take theirs. Either side can counter.' },
  { icon: '✅', title: 'Get it done', body: 'Coordinate in chat, do the task, rate each other. Free to post.' },
];

const CATEGORIES = ['🧹 Cleaning', '🧺 Laundry', '🍱 Spare meals', '🛒 Grocery runs', '📦 Parcels', '🧳 Move/shift', '📚 Study help'];

interface Stats {
  openTasks: number;
  completedTasks: number;
  campuses: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/v1/public/stats', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d))
      .catch(() => setStats(null));
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
        {/* Left: the pitch */}
        <div className="mx-auto max-w-md lg:mx-0 lg:max-w-none">
          <h1 className="text-xl font-bold text-blue-700">CampusBuddy</h1>
          <p className="text-sm text-slate-500">On-demand campus help — by students, for students.</p>

          <p className="mt-5 text-3xl font-semibold leading-tight lg:text-4xl">
            Campus chores, done on demand by fellow students.
          </p>
          <p className="mt-3 text-slate-600 lg:text-lg">
            Post a task — laundry, parcel runs, an extra home-cooked meal, cleaning, study help — and
            a verified student from your campus gets it done. No waiting on a friend, no owing anyone
            a favour.
          </p>

          <div className="mt-8 max-w-xs space-y-3">
            <Link
              href="/login"
              className="block rounded-xl bg-blue-700 px-4 py-3 text-center font-medium text-white hover:bg-blue-800"
            >
              Join with your campus email
            </Link>
            <Link href="/login" className="block text-center text-sm font-medium text-slate-500 hover:text-slate-700">
              Already have an account? Sign in ›
            </Link>
          </div>

          {/* Live proof — real counts, not marketing copy */}
          {stats && (stats.openTasks > 0 || stats.completedTasks > 0) && (
            <div className="mt-8 flex gap-6 text-sm">
              <div>
                <span className="text-xl font-bold text-blue-700">{stats.openTasks}</span>
                <span className="ml-1.5 text-slate-500">open right now</span>
              </div>
              <div>
                <span className="text-xl font-bold text-blue-700">{stats.completedTasks}</span>
                <span className="ml-1.5 text-slate-500">tasks completed</span>
              </div>
              <div>
                <span className="text-xl font-bold text-blue-700">{stats.campuses}</span>
                <span className="ml-1.5 text-slate-500">campuses</span>
              </div>
            </div>
          )}

          <ul className="mt-8 space-y-2 text-sm text-slate-600">
            <li>✓ Verified students only (NTU, NUS, SUTD, SMU &amp; more)</li>
            <li>✓ On demand — no waiting on busy friends, no owing favours</li>
            <li>✓ Contactless options where it makes sense · two-way ratings</li>
          </ul>

          <p className="mt-6 text-xs text-slate-400">Now launching at NTU.</p>
        </div>

        {/* Right (desktop only): how it works + categories */}
        <div className="mt-12 hidden lg:mt-0 lg:block">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">How it works</p>
            <div className="mt-4 space-y-4">
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">
                      <span aria-hidden="true">{s.icon}</span> {s.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
              What people post
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span key={c} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile-only how it works (compact) */}
        <div className="mx-auto mt-10 max-w-md space-y-3 lg:hidden">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">
                  <span aria-hidden="true">{s.icon}</span> {s.title}
                </p>
                <p className="text-xs text-slate-500">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
