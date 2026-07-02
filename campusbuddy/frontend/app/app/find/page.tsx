import Link from 'next/link';
import { MOCK_TASKS } from '../../../lib/mockTasks';
import { formatSgd } from '../../../lib/format';
import { SponsoredCard } from '../../../components/Sponsored';
import { adFor } from '../../../lib/ads';

// Provider task feed (wireframe #6, docs/05). Apply leads to the verification gate.
export default function FindPage() {
  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">Available <span className="text-green-500">●</span></span>
        <span className="text-sm text-slate-500">Filters ▾</span>
      </header>

      <div className="space-y-3 p-4">
        <p className="text-xs text-slate-500">Laundry, Parcel · Halls 8–11</p>
        <SponsoredCard ad={adFor(2)} />
        {MOCK_TASKS.map((t) => (
          <div key={t.id} className="rounded-xl border bg-white p-3">
            <div className="flex justify-between">
              <span className="font-medium">{t.icon} {t.title}</span>
              <span className="text-green-700">{formatSgd(t.priceCents)}{t.study ? '/hr' : ''}</span>
            </div>
            {t.study ? (
              <div className="mt-1 text-sm text-slate-500">
                <p>📖 {t.study.topics.join(' · ')}</p>
                <p className="text-xs">
                  {t.study.level} · goal: {t.study.goal} · {t.study.format} · {t.when}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                {t.hall} · {t.when} · {t.distanceKm}km · cust ⭐{t.customerRating}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              {t.study?.helpTypes.map((h) => (
                <span key={h} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{h}</span>
              ))}
              {t.category === 'Study help' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">📚 tutoring only</span>
              )}
              {t.requiresMatricVerification && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">🪪 ID-verified</span>
              )}
              {t.sameGenderOnly && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  {t.customerGender === 'F' ? '♀ female buddies' : '♂ male buddies'}
                </span>
              )}
              {t.presenceRequired && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">👥 customer present</span>
              )}
              {t.contactless && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">📦 contactless</span>
              )}
            </div>
            <Link
              href={`/app/apply/${t.id}`}
              className="mt-2 block rounded-lg bg-blue-700 py-2 text-center text-sm font-medium text-white"
            >
              Apply
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
