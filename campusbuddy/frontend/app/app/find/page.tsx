// Provider task feed (wireframe #6, docs/05). Mock data; T2 tasks show the
// ID-verification gate from the risk-tier redesign (docs/16).
const FEED = [
  { icon: '📦', title: 'Parcel pickup', price: 'S$6', meta: 'Hall 10 · now · 0.3km · cust ⭐4.8', tier: 'T1' },
  { icon: '🧺', title: 'Laundry pickup', price: 'S$10', meta: 'Hall 9 · 5–7pm · 0.5km · cust ⭐5.0', tier: 'T1' },
  { icon: '🧹', title: 'Room cleaning', price: 'S$20', meta: 'Hall 8 · today · 🪪 ID-verified required', tier: 'T2' },
];

export default function FindPage() {
  return (
    <div>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="font-semibold">Available <span className="text-green-500">●</span></span>
        <span className="text-sm text-slate-500">Filters ▾</span>
      </header>

      <div className="space-y-3 p-4">
        <p className="text-xs text-slate-500">Laundry, Parcel · Halls 8–11</p>
        {FEED.map((t) => (
          <div key={t.title} className="rounded-xl border bg-white p-3">
            <div className="flex justify-between">
              <span className="font-medium">{t.icon} {t.title}</span>
              <span className="text-green-700">{t.price}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{t.meta}</p>
            <button className="mt-2 w-full rounded-lg bg-blue-700 py-2 text-sm font-medium text-white">
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
