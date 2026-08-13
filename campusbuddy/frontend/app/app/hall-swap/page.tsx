'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, BellRing, Check, House, Pause, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { api, ApiClientError } from '../../../lib/api';
import { enablePush, getExistingSubscription, pushConfigured, pushSupported } from '../../../lib/push';
import { useStore } from '../../../lib/store';
import {
  AIRCON_PREFERENCES,
  HALL_SWAP_TERMS,
  NTU_HALLS,
  ROOM_TYPES,
  airconPreferenceLabel,
  roomLabel,
  type AirconPreference,
  type HallSwapConnection,
  type HallSwapMatch,
  type HallSwapPreferences,
  type RoomType,
} from '../../../lib/hallSwap';

type Draft = Omit<HallSwapPreferences, 'isActive'>;

const EMPTY_DRAFT: Draft = {
  gender: 'MALE',
  term: HALL_SWAP_TERMS[0],
  haveHall: NTU_HALLS[0],
  haveRoomType: 'DOUBLE',
  haveAircon: false,
  wantedHalls: [],
  wantedRoomTypes: ['SINGLE'],
  wantedAircon: 'ANY',
};

function ToggleButton({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm transition ${
        selected ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'bg-white text-slate-600 hover:border-slate-400'
      }`}
    >
      {children}
    </button>
  );
}

function PreferencesForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: Draft;
  saving: boolean;
  onSave: (draft: Draft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const anyHall = draft.wantedHalls.length === 0;

  function toggleWantedHall(hall: string) {
    setDraft((current) => ({
      ...current,
      wantedHalls: current.wantedHalls.includes(hall)
        ? current.wantedHalls.filter((item) => item !== hall)
        : [...current.wantedHalls, hall],
    }));
  }

  function toggleRoom(room: RoomType) {
    setDraft((current) => {
      const has = current.wantedRoomTypes.includes(room);
      if (has && current.wantedRoomTypes.length === 1) return current;
      return {
        ...current,
        wantedRoomTypes: has
          ? current.wantedRoomTypes.filter((item) => item !== room)
          : [...current.wantedRoomTypes, room],
      };
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(draft);
      }}
    >
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
          <div>
            <h2 className="font-semibold">Your current allocation</h2>
            <p className="text-xs text-slate-500">No room number or personal contact details needed.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-slate-600">Gender eligibility</span>
            <select
              value={draft.gender}
              onChange={(event) => setDraft({ ...draft, gender: event.target.value as Draft['gender'] })}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            >
              <option value="MALE">Male room</option>
              <option value="FEMALE">Female room</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Swap period</span>
            <select
              value={draft.term}
              onChange={(event) => setDraft({ ...draft, term: event.target.value })}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            >
              {HALL_SWAP_TERMS.map((term) => <option key={term}>{term}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-slate-600">Hall you have</span>
            <select
              value={draft.haveHall}
              onChange={(event) => setDraft({ ...draft, haveHall: event.target.value })}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            >
              {NTU_HALLS.map((hall) => <option key={hall}>{hall}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-600">Room type</p>
          <div className="mt-2 flex gap-2">
            {ROOM_TYPES.map((room) => (
              <ToggleButton key={room} selected={draft.haveRoomType === room} onClick={() => setDraft({ ...draft, haveRoomType: room })}>
                {room === 'SINGLE' ? 'Single' : 'Double'}
              </ToggleButton>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-slate-600">Air-con</p>
          <div className="mt-2 flex gap-2">
            <ToggleButton selected={draft.haveAircon} onClick={() => setDraft({ ...draft, haveAircon: true })}>Air-con</ToggleButton>
            <ToggleButton selected={!draft.haveAircon} onClick={() => setDraft({ ...draft, haveAircon: false })}>Non-air-con</ToggleButton>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
          <div>
            <h2 className="font-semibold">What you want</h2>
            <p className="text-xs text-slate-500">Broader choices give you more reciprocal matches.</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Preferred halls</p>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, wantedHalls: [] })}
              className={`text-xs font-medium ${anyHall ? 'text-blue-700' : 'text-slate-500'}`}
            >
              {anyHall ? '✓ Any hall selected' : 'Accept any hall'}
            </button>
          </div>
          <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border bg-slate-50 p-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NTU_HALLS.map((hall) => (
                <ToggleButton key={hall} selected={draft.wantedHalls.includes(hall)} onClick={() => toggleWantedHall(hall)}>
                  {hall}
                </ToggleButton>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {anyHall ? 'You will consider every NTU hall.' : `${draft.wantedHalls.length} hall${draft.wantedHalls.length === 1 ? '' : 's'} selected.`}
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-600">Room types you will accept</p>
            <div className="mt-2 flex gap-2">
              {ROOM_TYPES.map((room) => (
                <ToggleButton key={room} selected={draft.wantedRoomTypes.includes(room)} onClick={() => toggleRoom(room)}>
                  {room === 'SINGLE' ? 'Single' : 'Double'}
                </ToggleButton>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm text-slate-600">Air-con preference</span>
            <select
              value={draft.wantedAircon}
              onChange={(event) => setDraft({ ...draft, wantedAircon: event.target.value as AirconPreference })}
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
            >
              {AIRCON_PREFERENCES.map((value) => <option key={value} value={value}>{airconPreferenceLabel(value)}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <b>Matching only.</b> Do not offer rent, cash top-ups or unofficial room transfers. Both residents must use NTU&apos;s official room-swap process and wait for approval.
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border bg-white py-3 text-sm font-medium text-slate-600">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-[2] rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Finding reciprocal matches…' : 'Save preferences & find matches'}
        </button>
      </div>
    </form>
  );
}

function MatchCard({ match, busy, onConnect }: { match: HallSwapMatch; busy: boolean; onConnect: (id: string) => Promise<void> }) {
  return (
    <article className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            {match.firstName[0]?.toUpperCase() ?? 'N'}
          </span>
          <div>
            <p className="font-semibold">{match.firstName}</p>
            <p className="text-sm text-slate-500">Has {match.haveHall}</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${match.matchType === 'EXACT' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {match.matchType === 'EXACT' ? 'Exact reciprocal' : 'Reciprocal match'}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="font-medium text-slate-800">{roomLabel(match.haveRoomType, match.haveAircon)}</p>
        <p className="mt-0.5 text-xs text-slate-500">{match.term}</p>
        <div className="mt-2 space-y-1">
          {match.matchedOn.map((reason) => (
            <p key={reason} className="flex items-start gap-1.5 text-xs text-slate-600">
              <Check size={13} className="mt-0.5 shrink-0 text-green-600" aria-hidden="true" /> {reason}
            </p>
          ))}
        </div>
      </div>

      {match.connectionStatus === 'CONNECTED' && match.contact ? (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
          <p className="font-medium text-green-800">You both agreed to connect</p>
          <p className="mt-1 text-green-700">{match.contact.name}</p>
          <a href={`mailto:${match.contact.email}`} className="break-all font-medium text-blue-700">{match.contact.email}</a>
        </div>
      ) : match.connectionStatus === 'SENT' ? (
        <button disabled className="mt-3 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500">Introduction requested</button>
      ) : match.connectionStatus === 'RECEIVED' ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-center text-sm font-medium text-amber-800">They asked to connect — respond below</p>
      ) : (
        <button
          onClick={() => void onConnect(match.id)}
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-blue-700 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? 'Requesting…' : 'Request private introduction'}
        </button>
      )}
      <p className="mt-2 text-center text-[11px] text-slate-400">Contact is shared only after both students agree.</p>
    </article>
  );
}

export default function HallSwapPage() {
  const { me } = useStore();
  const [profile, setProfile] = useState<HallSwapPreferences | null>(null);
  const [matches, setMatches] = useState<HallSwapMatch[]>([]);
  const [connections, setConnections] = useState<HallSwapConnection[]>([]);
  const [activeProfiles, setActiveProfiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [browserAlertsAvailable, setBrowserAlertsAvailable] = useState(false);
  const [browserAlertsEnabled, setBrowserAlertsEnabled] = useState(false);
  const [browserAlertsBusy, setBrowserAlertsBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.hallSwaps();
      setProfile(result.profile);
      setMatches(result.matches);
      setConnections(result.connections);
      setActiveProfiles(result.activeProfiles);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load hall-swap preferences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const available = pushSupported() && pushConfigured();
    setBrowserAlertsAvailable(available);
    if (available) {
      getExistingSubscription()
        .then((subscription) => setBrowserAlertsEnabled(Boolean(subscription)))
        .catch(() => setBrowserAlertsEnabled(false));
    }
  }, []);

  const initialDraft = useMemo<Draft>(() => profile ? {
    gender: profile.gender,
    term: profile.term,
    haveHall: profile.haveHall,
    haveRoomType: profile.haveRoomType,
    haveAircon: profile.haveAircon,
    wantedHalls: profile.wantedHalls,
    wantedRoomTypes: profile.wantedRoomTypes,
    wantedAircon: profile.wantedAircon,
  } : EMPTY_DRAFT, [profile]);

  async function save(draft: Draft) {
    setSaving(true);
    setError(null);
    setSavedNotice(null);
    try {
      const result = await api.saveHallSwap(draft);
      setProfile(result.profile);
      setMatches(result.matches);
      setConnections(result.connections);
      setActiveProfiles(result.activeProfiles);
      setEditing(false);
      setSavedNotice(result.matches.length > 0
        ? `Preferences saved. We found ${result.matches.length} reciprocal match${result.matches.length === 1 ? '' : 'es'} and added an alert to Activity.`
        : 'Preferences saved. Matching stays active and we’ll notify you in Activity when a reciprocal swap is found.');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  }

  async function turnOnBrowserAlerts() {
    if (browserAlertsBusy) return;
    setBrowserAlertsBusy(true);
    setError(null);
    try {
      await enablePush();
      setBrowserAlertsEnabled(true);
      setSavedNotice('Browser alerts are on. We’ll notify this device when a reciprocal swap is found.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable browser alerts.');
    } finally {
      setBrowserAlertsBusy(false);
    }
  }

  async function pause() {
    setBusyId('pause');
    setError(null);
    try {
      await api.pauseHallSwap();
      setProfile((current) => current ? { ...current, isActive: false } : null);
      setMatches([]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not pause matching.');
    } finally {
      setBusyId(null);
    }
  }

  async function connect(profileId: string) {
    setBusyId(profileId);
    setError(null);
    try {
      await api.requestHallSwapIntro(profileId);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not request an introduction.');
    } finally {
      setBusyId(null);
    }
  }

  async function respond(connectionId: string, action: 'ACCEPT' | 'DECLINE') {
    setBusyId(connectionId);
    setError(null);
    try {
      await api.respondHallSwapIntro(connectionId, action);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not respond to that request.');
    } finally {
      setBusyId(null);
    }
  }

  if (!me || loading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading Hall Swap Matcher…</div>;
  }

  if (me.campus !== 'NTU') {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <header className="border-b bg-white px-4 py-3 font-semibold">Hall Swap Matcher</header>
        <div className="p-4">
          <div className="rounded-2xl border bg-white p-8 text-center">
            <House className="mx-auto text-blue-700" size={36} />
            <h1 className="mt-3 text-xl font-semibold">Starting at NTU</h1>
            <p className="mt-2 text-sm text-slate-500">This matcher uses NTU&apos;s mutual room-swap workflow. Campus-specific versions can be added after their housing rules are verified.</p>
          </div>
        </div>
      </div>
    );
  }

  const incoming = connections.filter((item) => item.status === 'PENDING' && item.direction === 'INCOMING');
  const connected = connections.filter((item) => item.status === 'ACCEPTED');

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base"><ArrowLeftRight className="shrink-0" size={18} /> Hall Swap Matcher</span>
        {profile?.isActive && !editing && (
          <button onClick={() => setEditing(true)} className="shrink-0 text-xs font-medium text-blue-700 sm:text-sm">Edit preferences</button>
        )}
      </header>

      <div className="space-y-5 p-4 lg:px-0">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex max-w-full items-center gap-1 whitespace-normal rounded-full bg-white/15 px-2 py-1 text-[11px] font-medium">
                <Sparkles size={12} /> Free for verified NTU students
              </span>
              <h1 className="mt-3 text-xl font-bold sm:text-2xl">Stop searching hundreds of Telegram posts.</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">Tell us what you have and what you want. We show only students whose preferences work both ways.</p>
            </div>
            <House className="hidden shrink-0 text-blue-200 sm:block" size={52} strokeWidth={1.5} />
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {savedNotice && <p aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">{savedNotice}</p>}

        {(!profile || !profile.isActive || editing) ? (
          <PreferencesForm initial={initialDraft} saving={saving} onSave={save} onCancel={profile?.isActive ? () => setEditing(false) : undefined} />
        ) : (
          <>
            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 shrink-0 text-blue-700" size={21} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-blue-950">Match alerts are active</p>
                  <p className="mt-0.5 text-sm text-blue-900">
                    We’ll add an Activity notification when a new reciprocal swap is found, even if you have no matches today.
                  </p>
                  {browserAlertsAvailable && (
                    browserAlertsEnabled ? (
                      <p className="mt-2 text-xs font-medium text-green-700">✓ Browser alerts are enabled on this device</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void turnOnBrowserAlerts()}
                        disabled={browserAlertsBusy}
                        className="mt-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {browserAlertsBusy ? 'Enabling…' : 'Also notify this device'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Your room</p>
                <p className="mt-1 font-semibold">{profile.haveHall}</p>
                <p className="text-sm text-slate-500">{roomLabel(profile.haveRoomType, profile.haveAircon)}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Reciprocal matches</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{matches.length}</p>
                <p className="text-sm text-slate-500">from {activeProfiles} active profile{activeProfiles === 1 ? '' : 's'}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Looking for</p>
                <p className="mt-1 font-semibold">{profile.wantedHalls.length === 0 ? 'Any NTU hall' : `${profile.wantedHalls.length} selected hall${profile.wantedHalls.length === 1 ? '' : 's'}`}</p>
                <p className="text-sm text-slate-500">{profile.wantedRoomTypes.map((room) => room === 'SINGLE' ? 'Single' : 'Double').join(' or ')} · {airconPreferenceLabel(profile.wantedAircon)}</p>
              </div>
            </section>

            {incoming.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Introduction requests</h2>
                <div className="space-y-2">
                  {incoming.map((connection) => (
                    <div key={connection.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-amber-950">{connection.firstName} wants to connect</p>
                        <p className="text-sm text-amber-800">They have {connection.room}. Your contact details remain private until you accept.</p>
                      </div>
                      <div className="mt-3 flex gap-2 sm:mt-0">
                        <button onClick={() => void respond(connection.id, 'DECLINE')} disabled={busyId === connection.id} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-600">Decline</button>
                        <button onClick={() => void respond(connection.id, 'ACCEPT')} disabled={busyId === connection.id} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white">Accept & share contact</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {connected.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Connected students</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {connected.map((connection) => (
                    <div key={connection.id} className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
                      <p className="font-semibold text-green-900">{connection.contact?.name ?? connection.firstName}</p>
                      <p className="text-green-700">{connection.room}</p>
                      {connection.contact && <a href={`mailto:${connection.contact.email}`} className="break-all font-medium text-blue-700">{connection.contact.email}</a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Your reciprocal matches</h2>
                  <p className="text-sm text-slate-500">Both sides&apos; hall, room and air-con preferences are compatible.</p>
                </div>
                <button onClick={() => void load()} className="flex items-center gap-1 text-xs font-medium text-blue-700"><RefreshCw size={13} /> Refresh</button>
              </div>
              {matches.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {matches.map((match) => <MatchCard key={match.id} match={match} busy={busyId === match.id} onConnect={connect} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
                  <p className="text-3xl">🔎</p>
                  <p className="mt-2 font-semibold">No reciprocal match yet</p>
                  <p className="mt-1 text-sm text-slate-500">Your preferences are saved. We will notify you when a compatible student joins or updates theirs.</p>
                  <button onClick={() => setEditing(true)} className="mt-3 text-sm font-medium text-blue-700">Broaden your preferences ›</button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={22} />
                <div>
                  <h2 className="font-semibold text-blue-950">CampusBuddy finds the person; NTU approves the swap</h2>
                  <p className="mt-1 text-sm text-blue-900">For a mutual swap, both consenting residents must be of the same gender, submit their own room-change requests, name each other and wait for the official outcome.</p>
                  <a href="https://www.ntu.edu.sg/life-at-ntu/accommodation/undergraduate-housing/application" target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-700">Read NTU&apos;s official instructions ↗</a>
                </div>
              </div>
            </section>

            <button onClick={() => void pause()} disabled={busyId === 'pause'} className="mx-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <Pause size={13} /> {busyId === 'pause' ? 'Pausing…' : 'Pause my listing'}
            </button>
          </>
        )}

        <p className="text-center text-xs text-slate-400">
          Need help? <Link href="/app/profile" className="text-blue-700">Visit support</Link>. CampusBuddy never asks for a room number or payment for matching.
        </p>
      </div>
    </div>
  );
}
