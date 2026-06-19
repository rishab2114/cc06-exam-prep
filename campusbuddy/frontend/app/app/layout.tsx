import Link from 'next/link';

// Authenticated app shell with a mobile bottom nav. In production this layout would
// verify the session server-side and redirect to /login if absent (see docs/08).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
      <div className="flex-1 pb-16">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t bg-white py-2 text-xs text-slate-500">
        <Link href="/app" className="px-3">🏠<div>Home</div></Link>
        <Link href="/app/find" className="px-3">🔎<div>Find</div></Link>
        <Link href="/app/tasks/new" className="px-3">➕<div>Post</div></Link>
        <Link href="/app" className="px-3">💰<div>Wallet</div></Link>
        <Link href="/app" className="px-3">👤<div>Profile</div></Link>
      </nav>
    </div>
  );
}
