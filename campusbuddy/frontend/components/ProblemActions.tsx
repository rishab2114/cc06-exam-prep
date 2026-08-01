'use client';

import { useState } from 'react';
import { api, ApiClientError, REPORT_REASONS, type ReportReason } from '../lib/api';

// Off-ramps for a deal that's already been struck: cancel the booking (either
// party, before it's done) and report a problem (no-show, felt unsafe, work not
// as agreed, payment). Shown on both the poster's and the buddy's task views.
export function ProblemActions({
  taskId,
  canCancel,
  onChanged,
}: {
  taskId: string;
  canCancel: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState<null | 'cancel' | 'report'>(null);
  const [reason, setReason] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>('no_show');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  async function doCancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.cancelAssignment(taskId, reason);
      await onChanged();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Could not cancel — try again.');
      setBusy(false);
    }
  }

  async function doReport() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.reportTask(taskId, reportReason, reason);
      setReported(true);
      await onChanged();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Could not send report — try again.');
    } finally {
      setBusy(false);
    }
  }

  if (reported) {
    return (
      <div className="rounded-xl border border-border bg-surface p-3 text-sm text-muted">
        ✅ Report received — our team will review it and follow up. For anything urgent, email{' '}
        <a href="mailto:hello@campusbuddy.sg" className="font-medium text-brand">hello@campusbuddy.sg</a>.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs font-semibold uppercase text-subtle">Having an issue?</p>

      {open === null && (
        <div className="mt-2 flex flex-wrap gap-2">
          {canCancel && (
            <button
              onClick={() => { setOpen('cancel'); setReason(''); setError(null); }}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-text"
            >
              Cancel this booking
            </button>
          )}
          <button
            onClick={() => { setOpen('report'); setReason(''); setError(null); }}
            className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger"
          >
            🚩 Report a problem
          </button>
        </div>
      )}

      {open === 'cancel' && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted">Cancel this booking? The other person will be told, with your reason.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Reason (optional) — e.g. plans changed, they didn’t show…"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => void doCancel()}
              disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? 'Cancelling…' : 'Confirm cancel'}
            </button>
            <button onClick={() => setOpen(null)} className="text-sm text-subtle">Keep it</button>
          </div>
        </div>
      )}

      {open === 'report' && (
        <div className="mt-2 space-y-2">
          <div className="space-y-1">
            {REPORT_REASONS.map((r) => (
              <label key={r.key} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reportReason"
                  checked={reportReason === r.key}
                  onChange={() => setReportReason(r.key)}
                />
                {r.label}
              </label>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Anything else we should know? (optional)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => void doReport()}
              disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send report'}
            </button>
            <button onClick={() => setOpen(null)} className="text-sm text-subtle">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
