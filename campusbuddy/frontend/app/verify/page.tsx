import Link from 'next/link';

// "Check your email" screen (Auth.js verifyRequest page). In this demo build there's
// no real email, so a button lets you continue into the app to explore the UI.
export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? 'your NTU email';
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <div className="text-4xl">📬</div>
      <h1 className="mt-4 text-2xl font-bold">Check your inbox</h1>
      <p className="mt-2 text-slate-600">
        We sent a magic link to <span className="font-medium">{email}</span>. Click it to finish
        signing in.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-left text-sm text-slate-500">
        Demo build — email isn&apos;t actually sent. Continue below to explore the app UI.
      </div>

      <Link
        href="/app"
        className="mt-6 block w-full rounded-xl bg-blue-700 px-4 py-3 font-medium text-white"
      >
        Continue to app (demo)
      </Link>
      <Link href="/login" className="mt-3 text-sm text-slate-500">
        Use a different email
      </Link>
    </main>
  );
}
