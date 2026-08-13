'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError, type ApiTask, type ApiNotification, type Me, type MyOffer } from './api';

/**
 * App store, backed by the real API. Mounted by the /app layout: it loads the
 * session (/me, redirect to /login on 401) and keeps the campus feed, the
 * user's own posts, chat badge and notifications fresh.
 *
 * Freshness is a short poll of /api/v1/sync (a three-COUNT digest) rather than a
 * stream — see that route for why streaming can't work on serverless. When the
 * digest moves we refetch and fan out to pages via `subscribe()`. Events raised
 * this way carry no taskId (the digest doesn't know which task moved), so page
 * listeners treat a missing taskId as "might be mine" and refetch.
 */
export interface RealtimeEvent {
  kind: 'task' | 'chat' | 'notification';
  taskId?: string;
}

interface StoreShape {
  me: Me | null;
  ready: boolean;
  hydrating: boolean;
  feed: ApiTask[];
  myTasks: ApiTask[];
  myOffers: MyOffer[];
  messageUnread: number;
  savedTasks: ApiTask[];
  savedIds: Set<string>;
  toggleSave: (taskId: string) => Promise<void>;
  feedHasMore: boolean;
  loadMoreFeed: () => Promise<void>;
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

const SYNC_MS = 8_000; // how often an active tab asks "anything new?" (cheap digest)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [feed, setFeed] = useState<ApiTask[]>([]);
  const [myTasks, setMyTasks] = useState<ApiTask[]>([]);
  const [myOffers, setMyOffers] = useState<MyOffer[]>([]);
  const [messageUnread, setMessageUnread] = useState(0);
  const [savedTasks, setSavedTasks] = useState<ApiTask[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const loadingMore = useRef(false);
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
    if (feedR.status === 'fulfilled') {
      setFeed(feedR.value.tasks);
      setFeedCursor(feedR.value.nextCursor);
    }
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

  const refreshMessageUnread = useCallback(async () => {
    try {
      const r = await api.messageThreads();
      if (!alive.current) return;
      setMessageUnread(r.totalUnread);
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
    let onVisible: (() => void) | undefined;

    const onEvent = (ev: RealtimeEvent) => {
      // Bell/feed/my-tasks refresh on 'task'; the Chats badge refreshes on
      // 'chat' too (a message alone doesn't change the feed, just unread
      // counts). Then fan out to page subscribers.
      if (ev.kind === 'task') void refresh();
      else if (ev.kind === 'chat') {
        void refreshNotifications();
        void refreshMessageUnread();
      } else void refreshNotifications();
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
        // Reveal the authenticated shell as soon as identity is known. The six
        // independent dashboard reads can finish behind lightweight page
        // skeletons instead of holding the whole app on a full-screen spinner.
        setReady(true);
        await refresh();
        if (!alive.current) return;
        setHydrating(false);

        // Change detection is a poll, not a stream: on serverless each request
        // is its own process, so an in-process bus never reaches a held-open
        // connection and SSE dies at the function timeout regardless. /sync is
        // three indexed COUNTs, so polling it is cheap; we only do the real
        // refetch when the digest moves. Paused while the tab is hidden.
        let lastDigest: string | null = null;
        let lastMessages = 0;

        const poll = async () => {
          if (document.visibilityState !== 'visible' || !alive.current) return;
          try {
            const { v, messages } = await api.sync();
            if (!alive.current) return;
            if (lastDigest === null) {
              lastDigest = v;
              lastMessages = messages;
              return; // first read just establishes the baseline
            }
            if (v === lastDigest) return;
            const chatOnly = messages !== lastMessages;
            lastDigest = v;
            lastMessages = messages;
            onEvent({ kind: chatOnly ? 'chat' : 'task' });
          } catch {
            /* transient — the next tick retries, and pages keep their own timers */
          }
        };

        void poll();
        timer = setInterval(poll, SYNC_MS);

        // Coming back to the tab should feel instant, not wait for the next tick.
        onVisible = () => {
          if (document.visibilityState === 'visible') void poll();
        };
        document.addEventListener('visibilitychange', onVisible);
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 401) {
          router.replace('/login');
          return;
        }
        if (alive.current) {
          setReady(true);
          setHydrating(false);
        }
      }
    })();

    return () => {
      alive.current = false;
      if (timer) clearInterval(timer);
      if (onVisible) document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router, refresh, refreshNotifications, refreshMessageUnread]);

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

  const loadMoreFeed = useCallback(async () => {
    if (loadingMore.current || !feedCursor) return;
    loadingMore.current = true;
    try {
      const r = await api.feed(feedCursor);
      if (!alive.current) return;
      setFeed((prev) => [...prev, ...r.tasks]);
      setFeedCursor(r.nextCursor);
    } catch {
      /* leave the cursor as-is — user can tap "Load more" again */
    } finally {
      loadingMore.current = false;
    }
  }, [feedCursor]);

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
      value={{ me, ready, hydrating, feed, myTasks, myOffers, messageUnread, savedTasks, savedIds: new Set(savedTasks.map((t) => t.id)), toggleSave, feedHasMore: feedCursor !== null, loadMoreFeed, findTask, refresh, cancelTask, notifications, unread, markAllRead, signOut, subscribe }}
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
