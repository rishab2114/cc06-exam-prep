import Link from 'next/link';

// Custom 404 — a real product never shows the framework's bare error page.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">
        This page doesn&apos;t exist (or the task was removed).
      </p>
      <Link href="/app" className="mt-8 rounded-xl bg-brand px-6 py-3 font-medium text-white">
        Go to home
      </Link>
      <Link href="/app/find" className="mt-3 text-sm text-brand">Browse open tasks</Link>
    </main>
  );
}
