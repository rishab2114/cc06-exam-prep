'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError, type ApiTask, type ApiNotification, type Me, type MyOffer } from './api';

/**
 * App store, backed by the real API + realtime SSE. Mounted by the /app layout:
 * it loads the session (/me, redirect to /login on 401), keeps the campus feed,
 * the user's own posts, and notifications fresh, and holds ONE EventSource to
 * /api/v1/stream. Server nudges arrive instantly; pages subscribe via
 * `subscribe()` to react to events for a specific task/chat. A slow interval
 * remains only as a safety net (covers new campus posts that don't notify you,
 * and SSE gaps).
 */
export interface RealtimeEvent {
  kind: 'task' | 'chat' | 'notification';
  taskId?: string;
}

interface StoreShape {
  me: Me | null;
  ready: boolean;
  feed: ApiTask[];
  myTasks: ApiTask[];
  myOffers: MyOffer[];
  messageUnread: number;
  savedTasks: ApiTask[];
  savedIds: Set<string>;
  toggleSave: (taskId: string) => Promise<void>;
  findTask: (id: string) => ApiTask | undefined;
  refresh: () => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  notifications: ApiNotification[];
  unread: number;
  markAllRead: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Subscribe to realtime events; returns an unsubscribe fn. */
  subscribe: (fn: (ev: RealtimeEvent) => void) => () => void;
}

const StoreContext = createContext<StoreShape | null>(null);

const FALLBACK_MS = 45_000; // safety net only — SSE does the real-time work

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [feed, setFeed] = useState<ApiTask[]>([]);
  const [myTasks, setMyTasks] = useState<ApiTask[]>([]);
  const [myOffers, setMyOffers] = useState<MyOffer[]>([]);
  const [messageUnread, setMessageUnread] = useState(0);
  const [savedTasks, setSavedTasks] = useState<ApiTask[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const alive = useRef(true);
  const listeners = useRef(new Set<(ev: RealtimeEvent) => void>());

  const refresh = useCallback(async () => {
    const [feedR, mineR, offersR, threadsR, savedR, notifR] = await Promise.allSettled([
      api.feed(),
      api.myTasks(),
      api.myOffers(),
      api.messageThreads(),
      api.savedTasks(),
      api.notifications(),
    ]);
    if (!alive.current) return;
    if (feedR.status === 'fulfilled') setFeed(feedR.value.tasks);
    if (mineR.status === 'fulfilled') setMyTasks(mineR.value.tasks);
    if (offersR.status === 'fulfilled') setMyOffers(offersR.value.offers);
    if (threadsR.status === 'fulfilled') setMessageUnread(threadsR.value.totalUnread);
    if (savedR.status === 'fulfilled') setSavedTasks(savedR.value.tasks);
    if (notifR.status === 'fulfilled') {
      setNotifications(notifR.value.notifications);
      setUnread(notifR.value.unread);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const r = await api.notifications();
      if (!alive.current) return;
      setNotifications(r.notifications);
      setUnread(r.unread);
    } catch {
      /* fallback poll will recover */
    }
  }, []);

  const subscribe = useCallback((fn: (ev: RealtimeEvent) => void) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let es: EventSource | undefined;

    const onEvent = (ev: RealtimeEvent) => {
      // Bell always reflects the change; task-level events also refresh the
      // feed/my-tasks so lists stay live. Then fan out to page subscribers.
      if (ev.kind === 'task') void refresh();
      else void refreshNotifications();
      listeners.current.forEach((fn) => {
        try {
          fn(ev);
        } catch {
          /* a page listener throwing must not kill the stream */
        }
      });
    };

    (async () => {
      try {
        const { user } = await api.me();
        if (!alive.current) return;
        if (!user) {
          router.replace('/login');
          return;
        }
        setMe(user);
        await refresh();
        if (!alive.current) return;
        setReady(true);

        es = new EventSource('/api/v1/stream');
        es.onmessage = (e) => {
          if (!e.data) return;
          try {
            onEvent(JSON.parse(e.data) as RealtimeEvent);
          } catch {
            /* ignore malformed frames */
          }
        };
        // On error the browser auto-reconnects (we sent `retry:`); refresh once
        // reconnected so we don't miss anything that happened while offline.
        es.onopen = () => void refresh();

        timer = setInterval(() => {
          if (document.visibilityState === 'visible') void refresh();
        }, FALLBACK_MS);
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 401) {
          router.replace('/login');
          return;
        }
        if (alive.current) setReady(true);
      }
    })();

    return () => {
      alive.current = false;
      if (timer) clearInterval(timer);
      es?.close();
    };
  }, [router, refresh, refreshNotifications]);

  const findTask = useCallback(
    (id: string) => myTasks.find((t) => t.id === id) ?? feed.find((t) => t.id === id),
    [myTasks, feed],
  );

  const toggleSave = useCallback(
    async (taskId: string) => {
      const already = savedTasks.some((t) => t.id === taskId);
      const task = feed.find((t) => t.id === taskId) ?? myTasks.find((t) => t.id === taskId);
      // Optimistic: flip locally first so the bookmark icon responds instantly.
      setSavedTasks((prev) =>
        already ? prev.filter((t) => t.id !== taskId) : task ? [task, ...prev] : prev,
      );
      try {
        if (already) await api.unsaveTask(taskId);
        else await api.saveTask(taskId);
      } catch {
        setSavedTasks((prev) =>
          already ? (task ? [task, ...prev] : prev) : prev.filter((t) => t.id !== taskId),
        );
      }
    },
    [savedTasks, feed, myTasks],
  );

  const cancelTask = useCallback(
    async (id: string) => {
      await api.cancelTask(id);
      await refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markNotificationsRead();
    } catch {
      /* SSE/poll will reconcile */
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      router.replace('/login');
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center text-slate-400">
          <div className="text-3xl">🎒</div>
          <p className="mt-2 text-sm">Loading CampusBuddy…</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider
      value={{ me, ready, feed, myTasks, myOffers, messageUnread, savedTasks, savedIds: new Set(savedTasks.map((t) => t.id)), toggleSave, findTask, refresh, cancelTask, notifications, unread, markAllRead, signOut, subscribe }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export { parseSgdToCents } from '@campusbuddy/shared';
