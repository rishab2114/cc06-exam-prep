'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError, type ApiTask, type ApiNotification, type Me } from './api';

/**
 * App store, backed by the real API. Mounted by the /app layout: it loads the
 * session (/me) and redirects to /login when there isn't one, then keeps the
 * campus feed, the user's own posts, and notifications fresh — a light poll
 * stands in for SSE until Phase 2. Pages read from here and call `refresh()`
 * after mutations so every screen agrees on the state.
 */
interface StoreShape {
  me: Me | null;
  ready: boolean;
  feed: ApiTask[];
  myTasks: ApiTask[];
  findTask: (id: string) => ApiTask | undefined;
  refresh: () => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  notifications: ApiNotification[];
  unread: number;
  markAllRead: () => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreShape | null>(null);

const POLL_MS = 20_000; // notifications + feed freshness until SSE lands

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [feed, setFeed] = useState<ApiTask[]>([]);
  const [myTasks, setMyTasks] = useState<ApiTask[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    // Fire together; each is independent so one failure doesn't blank the rest.
    const [feedR, mineR, notifR] = await Promise.allSettled([
      api.feed(),
      api.myTasks(),
      api.notifications(),
    ]);
    if (!alive.current) return;
    if (feedR.status === 'fulfilled') setFeed(feedR.value.tasks);
    if (mineR.status === 'fulfilled') setMyTasks(mineR.value.tasks);
    if (notifR.status === 'fulfilled') {
      setNotifications(notifR.value.notifications);
      setUnread(notifR.value.unread);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setInterval> | undefined;
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
        timer = setInterval(() => {
          if (document.visibilityState === 'visible') void refresh();
        }, POLL_MS);
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 401) {
          router.replace('/login');
          return;
        }
        // network hiccup — show the shell, the poll will recover
        if (alive.current) setReady(true);
      }
    })();
    return () => {
      alive.current = false;
      if (timer) clearInterval(timer);
    };
  }, [router, refresh]);

  const findTask = useCallback(
    (id: string) => myTasks.find((t) => t.id === id) ?? feed.find((t) => t.id === id),
    [myTasks, feed],
  );

  const cancelTask = useCallback(
    async (id: string) => {
      await api.cancelTask(id);
      await refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    setUnread(0); // optimistic — reads are cheap to lose
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markNotificationsRead();
    } catch {
      /* poll will reconcile */
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
      value={{ me, ready, feed, myTasks, findTask, refresh, cancelTask, notifications, unread, markAllRead, signOut }}
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
