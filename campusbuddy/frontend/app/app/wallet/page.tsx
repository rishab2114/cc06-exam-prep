import Link from 'next/link';

// Earnings — deliberately empty until real payments ship. We never show a
// balance we can't actually pay out. This route is unlinked from the nav; it
// exists only so old bookmarks land somewhere honest.
export default function WalletPage() {
  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <header className="border-b bg-white px-4 py-3 font-semibold">Earnings</header>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-dashed bg-white p-6 text-center">
          <p className="text-3xl">💸</p>
          <p className="mt-2 font-medium">Payouts are coming</p>
          <p className="mt-1 text-sm text-slate-500">
            Right now CampusBuddy is free to use and buddies settle up in person (PayNow or cash).
            In-app escrow and bank payouts arrive with the payments launch — we&apos;ll show your
            balance here the moment it&apos;s real money.
          </p>
        </div>

        <Link
          href="/app/find"
          className="block rounded-xl bg-blue-700 py-3 text-center font-medium text-white"
        >
          Find tasks to help with
        </Link>
      </div>
    </div>
  );
}
