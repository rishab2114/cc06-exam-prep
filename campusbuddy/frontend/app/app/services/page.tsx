'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { formatSgd } from '../../../lib/format';
import { api, ApiClientError, type ApiTask } from '../../../lib/api';
import { CategoryIcon } from '../../../components/CategoryIcon';

// Services = the freelance side of the marketplace. Instead of "I need help",
// a student advertises a gig they'll do at a set rate; anyone can book it.
// Booking spins up a normal request with the gig owner's quote already on the
// table, so it drops straight into the accept → chat → complete flow.
export default function ServicesPage() {
  const router = useRouter();
  const [gigs, setGigs] = useState<ApiTask[] | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await api.services();
      setGigs(r.tasks);
    } catch {
      setGigs([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function book(id: string) {
    if (booking) return;
    setBooking(id);
    setError(null);
    try {
      const { task } = await api.bookGig(id);
      router.push(`/app/applicants/${task.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not book — try again.');
      setBooking(null);
    }
  }

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <header className="flex items-center justify-between border-b bg-surface px-4 py-3">
        <span className="flex items-center gap-2 font-semibold">
          <Briefcase size={18} aria-hidden="true" /> Services
        </span>
        <Link href="/app/services/new" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white">
          + Offer a service
        </Link>
      </header>

      <p className="px-4 pt-3 text-sm text-muted">
        Sample freelance listings from campus-domain accounts. Book one and the provider&apos;s quote
        is already on the table — accept, chat and try the full workflow.
      </p>

      {error && <p className="px-4 pt-2 text-sm text-danger">{error}</p>}

      <div className="p-4">
        {gigs === null ? (
          <p className="py-16 text-center text-sm text-subtle">Loading services…</p>
        ) : gigs.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-surface p-8 text-center text-sm text-muted">
            <p className="text-3xl">💼</p>
            <p className="mt-2 font-medium text-text">No services on offer yet</p>
            <p className="mt-1">Be the first — post a gig you can do for other students.</p>
            <Link href="/app/services/new" className="mt-3 inline-block font-medium text-brand">
              Offer a service ›
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gigs.map((g) => (
              <div key={g.id} className="flex flex-col rounded-xl border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">
                    <CategoryIcon category={g.category} emoji={g.icon} size="sm" /> {g.title}
                  </span>
                  <span className="shrink-0 font-semibold text-success">{formatSgd(g.priceCents)}</span>
                </div>
                <p className="mt-1 text-xs text-subtle">
                  {g.category} · by {g.customerName}
                  {g.hall && g.hall !== 'On campus' ? ` · ${g.hall}` : ''}
                </p>
                {g.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{g.description}</p>}
                <div className="mt-auto pt-3">
                  {g.isMine ? (
                    <span className="block rounded-lg border border-border py-2 text-center text-sm text-subtle">
                      Your gig
                    </span>
                  ) : (
                    <button
                      onClick={() => book(g.id)}
                      disabled={booking !== null}
                      className="block w-full rounded-lg bg-brand py-2 text-center text-sm font-medium text-white disabled:opacity-60"
                    >
                      {booking === g.id ? 'Booking…' : 'Request this service'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
