'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError, type ApiReview } from '../lib/api';

// Post-completion rating card, both sides. Shows the star picker while the
// viewer still owes a review, then the exchanged reviews.
export function RateCard({ taskId, counterpartName }: { taskId: string; counterpartName: string }) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.reviews(taskId);
      setReviews(r.reviews);
      setCanReview(r.canReview);
    } catch {
      /* transient — leave the card empty */
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.review(taskId, stars, comment);
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Could not submit — try again.');
    } finally {
      setBusy(false);
    }
  }

  const theirs = reviews.find((r) => !r.mine);
  const mine = reviews.find((r) => r.mine);

  return (
    <div className="rounded-xl border bg-surface p-3">
      <p className="font-medium">⭐ Rate {counterpartName}</p>

      {canReview ? (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setStars(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                className={n <= stars ? '' : 'opacity-25 grayscale'}
              >
                ⭐
              </button>
            ))}
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            placeholder="Optional — how did it go?"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="w-full rounded-xl bg-brand py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? 'Submitting…' : `Submit ${stars}-star review`}
          </button>
        </div>
      ) : mine ? (
        <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-green-800">
          You rated {counterpartName} {'⭐'.repeat(mine.stars)}
          {mine.comment ? ` — “${mine.comment}”` : ''}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">Rating opens when the task is completed.</p>
      )}

      {theirs && (
        <p className="mt-2 rounded-lg bg-surface-sunken px-3 py-2 text-sm text-muted">
          {theirs.raterName} rated you {'⭐'.repeat(theirs.stars)}
          {theirs.comment ? ` — “${theirs.comment}”` : ''}
        </p>
      )}
    </div>
  );
}
