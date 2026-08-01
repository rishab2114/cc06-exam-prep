'use client';

import { useState } from 'react';
import { api, ApiClientError, type ApiTask } from '../lib/api';
import { parseSgdToCents } from '../lib/store';

// Inline "Edit post" for the poster while the task is still OPEN (typo, time
// change, budget tweak). Once a buddy is accepted the deal is locked — the
// server enforces it too. Open bidders are notified that the post changed.
export function EditTask({ task, onSaved }: { task: ApiTask; onSaved: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(task.description ?? '');
  const [hall, setHall] = useState(task.hall);
  const [when, setWhen] = useState(task.when);
  const [budget, setBudget] = useState((task.priceCents / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseSgdToCents(budget);
  const invalid = cents <= 0;

  async function save() {
    if (busy || invalid) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateTask(task.id, {
        description: description.trim(),
        hall: hall.trim(),
        when: when.trim(),
        priceCents: cents,
      });
      setOpen(false);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Could not save — try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-medium text-brand">
        ✏️ Edit post
      </button>
    );
  }

  return (
    <div className="rounded-xl border bg-surface p-3 text-sm">
      <p className="font-medium">✏️ Edit your post</p>
      <p className="mt-0.5 text-xs text-subtle">
        Buddies with open offers will be notified of the change.
      </p>

      <div className="mt-3 space-y-3">
        {!task.study && (
          <label className="block">
            <span className="text-muted">What do you need?</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
        )}
        <div className="flex gap-2">
          <label className="block flex-1">
            <span className="text-muted">Where</span>
            <input value={hall} onChange={(e) => setHall(e.target.value)} maxLength={60} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="block flex-1">
            <span className="text-muted">When</span>
            <input value={when} onChange={(e) => setWhen(e.target.value)} maxLength={40} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
        </div>
        <label className="block">
          <span className="text-muted">Budget (SGD{task.study ? ' per hour' : ''})</span>
          <input
            type="number"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            aria-invalid={invalid}
          />
          {invalid && <span className="mt-1 block text-xs text-red-500">Enter a budget above S$0.</span>}
        </label>

        {error && <p className="text-danger">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => void save()}
            disabled={busy || invalid}
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={() => setOpen(false)} className="text-subtle">Cancel</button>
        </div>
      </div>
    </div>
  );
}
