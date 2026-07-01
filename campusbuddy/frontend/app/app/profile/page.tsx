import Link from 'next/link';
import { CURRENT_PROVIDER } from '../../../lib/mockTasks';
import { formatSgd } from '../../../lib/format';

// Provider/customer profile (docs/01). Mock data; verification badges reflect the
// trust model. In production this reads the signed-in user.
const SETTINGS = [
  { label: 'Edit profile', icon: '✏️' },
  { label: 'Notifications', icon: '🔔' },
  { label: 'Safety & SOS', icon: '🛟' },
  { label: 'Payment & payouts', icon: '💳' },
  { label: 'Help & support', icon: '❓' },
];

export default function ProfilePage() {
  const p = CURRENT_PROVIDER;
  return (
    <div>
      <header className="border-b bg-white px-4 py-3 font-semibold">Profile</header>

      <div className="space-y-4 p-4">
        {/* Identity card */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {p.name[0]}
            </div>
            <div>
              <p className="text-lg font-semibold">{p.name}</p>
              <p className="text-sm text-slate-500">{p.campus} · {p.year} · {p.hall}</p>
              <p className="text-xs text-slate-400">{p.school}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">🪪 Matric-verified</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">🎓 {p.campus} email verified</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">⭐{p.rating}</p>
            <p className="text-xs text-slate-500">Rating</p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">{p.completedJobs}</p>
            <p className="text-xs text-slate-500">Jobs done</p>
          </div>
          <Link href="/app/wallet" className="rounded-xl border bg-white p-3">
            <p className="text-lg font-bold">{formatSgd(p.monthCents)}</p>
            <p className="text-xs text-slate-500">This month</p>
          </Link>
        </div>

        {/* Services offered */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Services you offer</p>
          <div className="flex flex-wrap gap-2">
            {p.services.map((s) => (
              <span key={s} className="rounded-full border bg-white px-3 py-1 text-sm">{s}</span>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section>
          <div className="divide-y overflow-hidden rounded-xl border bg-white">
            {SETTINGS.map((s) => (
              <button key={s.label} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm">
                <span>{s.icon} {s.label}</span>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
        </section>

        <Link href="/" className="block rounded-xl border border-red-200 py-3 text-center text-sm font-medium text-red-600">
          Log out
        </Link>
      </div>
    </div>
  );
}
