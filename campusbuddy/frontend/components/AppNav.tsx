'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Briefcase,
  PlusCircle,
  MessageCircle,
  Bell,
  User,
  Sparkles,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '../lib/store';

// Single source of truth for app navigation, rendered as a desktop sidebar and a
// mobile bottom tab bar. Real icons (not emoji) here: this is chrome a screen
// reader announces on every page, so it gets a proper accessible name instead
// of a glyph like "broom" or "envelope". Active route is highlighted; Activity
// and Chats each carry a live unread badge. Wallet stays out until real
// payments ship.
// Rule 9: a bottom tab bar tops out at 5 — more and the targets get too small
// and the hierarchy stops reading. Services and Profile stay in the desktop
// sidebar (which has room) and remain reachable in-app from Explore and the
// header, so nothing becomes unreachable on mobile.
const TABS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/app', icon: Home, label: 'Home' },
  { href: '/app/find', icon: Search, label: 'Explore' },
  { href: '/app/tasks/new', icon: PlusCircle, label: 'Post' },
  { href: '/app/messages', icon: MessageCircle, label: 'Chats' },
  { href: '/app/notifications', icon: Bell, label: 'Activity' },
];

const SIDEBAR: { href: string; icon: LucideIcon; label: string }[] = [
  ...TABS.slice(0, 2),
  { href: '/app/services', icon: Briefcase, label: 'Services' },
  ...TABS.slice(2),
  { href: '/app/profile', icon: User, label: 'Profile' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href);
}

function badgeCountFor(label: string, unread: number, messageUnread: number): number {
  if (label === 'Activity') return unread;
  if (label === 'Chats') return messageUnread;
  return 0;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-danger px-1.5 text-[10px] font-bold leading-4 text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function AppNav({ variant }: { variant: 'sidebar' | 'tabs' }) {
  const pathname = usePathname();
  const { me, unread, messageUnread } = useStore();

  if (variant === 'tabs') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] pt-1.5 text-center text-[10px] lg:hidden">
        {TABS.map((n) => {
          const active = isActive(pathname, n.href);
          const badge = badgeCountFor(n.label, unread, messageUnread);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${active ? 'text-brand' : 'text-muted'}`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-danger px-1 text-[9px] font-bold leading-3 text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className={active ? 'font-medium' : ''}>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-border bg-surface p-4 lg:flex">
      <Link href="/app" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        CampusBuddy
      </Link>
      <nav className="space-y-1">
        {SIDEBAR.map((n) => {
          const active = isActive(pathname, n.href);
          const badge = badgeCountFor(n.label, unread, messageUnread);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-150 ${
                active ? 'bg-brand-soft font-semibold text-brand' : 'text-text hover:bg-surface-sunken'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span>{n.label}</span>
              <Badge count={badge} />
            </Link>
          );
        })}
      </nav>

      {me && (
        <Link
          href="/app/profile"
          className="mt-auto flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-surface-sunken"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            {me.name[0]?.toUpperCase() ?? 'S'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{me.name}</span>
            <span className="flex items-center gap-1 truncate text-xs text-subtle">
              <ShieldCheck size={12} className="shrink-0 text-brand" aria-hidden="true" />
              {me.campus} · verified
            </span>
          </span>
        </Link>
      )}
    </aside>
  );
}
