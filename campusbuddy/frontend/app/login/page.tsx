'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isNtuEmail } from '../../lib/ntu';

// Sign-in / sign-up entry. Enforces the NTU email gate client-side (also enforced
// server-side by Auth.js — see lib/auth.ts). Demo: "sending" the link routes to /verify.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isNtuEmail(email)) {
      setError('Please use your NTU email (e.g. yourname@e.ntu.edu.sg).');
      return;
    }
    setError(null);
    // In the real app this calls signIn('email', { email }). Demo just advances.
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="text-sm text-slate-500">‹ Back</Link>
      <h1 className="mt-4 text-2xl font-bold text-blue-700">Welcome to CampusBuddy</h1>
      <p className="mt-2 text-slate-600">Sign in or join with your NTU email. We&apos;ll send you a magic link — no password.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@e.ntu.edu.sg"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="block w-full rounded-xl bg-blue-700 px-4 py-3 font-medium text-white">
          Send magic link
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-400">
        Only NTU students can join. Accounts are verified by NTU email + matric card.
      </p>
    </main>
  );
}
