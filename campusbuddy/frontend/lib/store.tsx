'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { MockTask } from './mockTasks';

/**
 * Client-side app store: the user's posted tasks + notifications, persisted to
 * localStorage so the demo behaves like a real product (post -> appears in
 * Explore/Home, survives refresh). Swaps for the API layer later — pages only
 * talk to this interface.
 *
 * Hydration-safe: state starts empty on both server and first client render,
 * then loads from localStorage in an effect (avoids SSR markup mismatch).
 * localStorage reads are guarded — corrupted/legacy data must never crash the app.
 */
export interface AppNotification {
  id: string;
  text: string;
  at: number; // epoch ms
  read: boolean;
}

interface StoreShape {
  myTasks: MockTask[];
  addTask: (t: MockTask) => void;
  cancelTask: (id: string) => void;
  findTask: (id: string) => MockTask | undefined;
  notifications: AppNotification[];
  unread: number;
  notify: (text: string) => void;
  markAllRead: () => void;
}

const StoreContext = createContext<StoreShape | null>(null);

const TASKS_KEY = 'cb.myTasks.v1';
const NOTIFS_KEY = 'cb.notifications.v1';

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback; // corrupted storage or privacy mode — never crash
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / privacy mode — degrade silently
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [myTasks, setMyTasks] = useState<MockTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMyTasks(load<MockTask[]>(TASKS_KEY, []));
    setNotifications(load<AppNotification[]>(NOTIFS_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) save(TASKS_KEY, myTasks);
  }, [myTasks, hydrated]);
  useEffect(() => {
    if (hydrated) save(NOTIFS_KEY, notifications);
  }, [notifications, hydrated]);

  const addTask = useCallback((t: MockTask) => {
    setMyTasks((prev) => [t, ...prev].slice(0, 50)); // cap: no unbounded growth
  }, []);

  const cancelTask = useCallback((id: string) => {
    setMyTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const findTask = useCallback(
    (id: string) => myTasks.find((t) => t.id === id),
    [myTasks],
  );

  const notify = useCallback((text: string) => {
    setNotifications((prev) =>
      [{ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, at: Date.now(), read: false }, ...prev].slice(0, 100),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <StoreContext.Provider
      value={{ myTasks, addTask, cancelTask, findTask, notifications, unread, notify, markAllRead }}
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
