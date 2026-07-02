// Route-level loading skeleton for the app shell — cards shimmer instead of a
// blank flash while a page loads.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-10 w-1/2 rounded-xl bg-slate-200" />
      <div className="h-24 rounded-xl bg-slate-200" />
      <div className="h-24 rounded-xl bg-slate-200" />
      <div className="h-24 rounded-xl bg-slate-200" />
    </div>
  );
}
