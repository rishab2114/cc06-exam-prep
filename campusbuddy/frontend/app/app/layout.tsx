import Link from 'next/link';
import { StoreProvider } from '../../lib/store';

// Authenticated app shell. Mobile: bottom tab bar. Desktop (lg+): a real sidebar
// layout with a wider content column — not a stretched phone UI. In production
// this layout verifies the session server-side and redirects to /login (docs/08).
// Wallet is intentionally absent until real payments ship — we don't show a
// balance we can't pay out.
const NAV = [
  { href: '/app', icon: '🏠', label: 'Home' },
  { href: '/app/find', icon: '🔎', label: 'Explore' },
  { href: '/app/tasks/new', icon: '➕', label: 'Post' },
  { href: '/app/notifications', icon: '🔔', label: 'Activity' },
  { href: '/app/profile', icon: '👤', label: 'Profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-white p-4 lg:flex">
        <Link href="/app" className="mb-6 px-2 text-lg font-bold text-blue-700">
          CampusBuddy
        </Link>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-2 text-xs text-slate-400">Verified students only 🪪</p>
      </aside>

      {/* Content column: phone-width on mobile, comfortable width on desktop */}
      <div className="lg:pl-56">
        <div className="mx-auto w-full max-w-md pb-16 lg:max-w-3xl lg:px-6 lg:pb-8 lg:pt-4">
          {children}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-white py-2 text-center text-xs text-slate-500 lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="px-3">
            {n.icon}
            <div>{n.label}</div>
          </Link>
        ))}
      </nav>
    </div>
    </StoreProvider>
  );
}
