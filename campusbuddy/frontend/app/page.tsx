import Link from 'next/link';

// Landing / auth entry. See wireframe #1 in docs/05.
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-blue-700">CampusBuddy NTU</h1>
      <p className="mt-4 text-3xl font-semibold leading-tight">
        Campus chores, done by fellow NTU students.
      </p>
      <p className="mt-3 text-slate-600">
        Post a task — cleaning, laundry, food runs, parcel pickup — and a verified NTU buddy
        gets it done. Secure escrow payments, rated both ways.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/login"
          className="block rounded-xl bg-blue-700 px-4 py-3 text-center font-medium text-white"
        >
          Join with NTU email
        </Link>
        <Link
          href="/login"
          className="block rounded-xl border border-slate-300 px-4 py-3 text-center font-medium"
        >
          I already have an account
        </Link>
      </div>

      <ul className="mt-8 space-y-2 text-sm text-slate-600">
        <li>✓ Verified NTU students only</li>
        <li>✓ Secure escrow payments (15% platform fee)</li>
        <li>✓ Two-way ratings &amp; in-app safety tools</li>
      </ul>
    </main>
  );
}
