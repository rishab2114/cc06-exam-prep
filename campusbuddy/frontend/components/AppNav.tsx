'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '../lib/store';

// Single source of truth for app navigation, rendered as a desktop sidebar and a
// mobile bottom tab bar. Active route is highlighted and the Activity item
// carries a live unread badge. Wallet stays out until real payments ship.
const NAV = [
  { href: '/app', icon: '🏠', label: 'Home' },
  { href: '/app/find', icon: '🔎', label: 'Explore' },
  { href: '/app/tasks/new', icon: '➕', label: 'Post' },
  { href: '/app/notifications', icon: '🔔', label: 'Activity' },
  { href: '/app/profile', icon: '👤', label: 'Profile' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href);
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-4 text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function AppNav({ variant }: { variant: 'sidebar' | 'tabs' }) {
  const pathname = usePathname();
  const { me, unread } = useStore();

  if (variant === 'tabs') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t bg-white py-2 text-center text-xs lg:hidden">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`relative px-3 ${active ? 'text-blue-700' : 'text-slate-500'}`}
            >
              <span className="relative inline-block">
                {n.icon}
                {n.label === 'Activity' && unread > 0 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-3 text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <div className={active ? 'font-medium' : ''}>{n.label}</div>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-white p-4 lg:flex">
      <Link href="/app" className="mb-6 px-2 text-lg font-bold text-blue-700">
        CampusBuddy
      </Link>
      <nav className="space-y-1">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
              {n.label === 'Activity' && <Badge count={unread} />}
            </Link>
          );
        })}
      </nav>

      {me && (
        <Link
          href="/app/profile"
          className="mt-auto flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {me.name[0]?.toUpperCase() ?? '🎒'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{me.name}</span>
            <span className="block truncate text-xs text-slate-400">{me.campus} · verified 🪪</span>
          </span>
        </Link>
      )}
    </aside>
  );
}
