import Link from 'next/link';

// Landing / auth entry. See wireframe #1 in docs/05.
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-blue-700">CampusBuddy</h1>
      <p className="text-sm text-slate-500">Urban Company for students — by students, cheaper.</p>
      <p className="mt-4 text-3xl font-semibold leading-tight">
        Campus chores, done on demand by fellow students.
      </p>
      <p className="mt-3 text-slate-600">
        Post a task — laundry, parcel runs, an extra home-cooked meal, cleaning — and a verified
        student from your campus gets it done. No waiting on a friend, no owing anyone a favour.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/login"
          className="block rounded-xl bg-blue-700 px-4 py-3 text-center font-medium text-white"
        >
          Join with your campus email
        </Link>
        <Link
          href="/login"
          className="block rounded-xl border border-slate-300 px-4 py-3 text-center font-medium"
        >
          I already have an account
        </Link>
      </div>

      <ul className="mt-8 space-y-2 text-sm text-slate-600">
        <li>✓ Verified students only (SUTD, NTU, NUS, SMU &amp; more)</li>
        <li>✓ On demand — no waiting on busy friends, no owing favours</li>
        <li>✓ Same-gender &amp; contactless options · two-way ratings</li>
      </ul>

      <p className="mt-6 text-xs text-slate-400">Now launching at SUTD.</p>
    </main>
  );
}
