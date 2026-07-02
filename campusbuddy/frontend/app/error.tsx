'use client';

// Global error boundary — an unexpected crash shows a friendly recovery screen
// instead of a white page. `reset()` re-renders the failed segment.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">😵</p>
      <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">
        Sorry — that wasn&apos;t supposed to happen. Try again, and if it keeps happening let us
        know at hello@campusbuddy.sg.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white"
      >
        Try again
      </button>
      <a href="/app" className="mt-3 text-sm text-blue-700">Back to home</a>
    </main>
  );
}
