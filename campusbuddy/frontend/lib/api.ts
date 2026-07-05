import type { Task as SharedTask, StudyRequest } from '@campusbuddy/shared';

/**
 * Typed client for /api/v1 — the only place the frontend talks HTTP. Every
 * endpoint returns the {error:{code,message}} envelope on failure; we surface
 * that as ApiClientError so pages can show the server's message verbatim.
 */
export interface ApiTask extends SharedTask {
  status: string;
  customerId: string;
  isMine: boolean;
  offerCount: number;
}

export interface ApiOffer {
  id: string;
  taskId: string;
  providerId: string;
  providerName: string;
  amountCents: number;
  round: number;
  state: string;
  lastActor: string;
  message: string | null;
  yourTurn: boolean;
  providerRating: number | null;
  providerJobs: number;
}

export interface ApiMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  at: number;
  mine: boolean;
}

export interface ApiReview {
  id: string;
  raterId: string;
  raterName: string;
  stars: number;
  comment: string | null;
  mine: boolean;
}

export interface Me {
  id: string;
  name: string;
  email: string;
  campus: string;
  hall: string | null;
  verifiedAt: string | null;
  rating: number | null;
  jobsDone: number;
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: { taskId?: string; offerId?: string } | null;
  read: boolean;
  at: number;
}

export type ReportReason = 'no_show' | 'unsafe' | 'not_as_agreed' | 'payment' | 'other';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'no_show', label: 'They didn’t show up' },
  { key: 'not_as_agreed', label: 'Work wasn’t as agreed' },
  { key: 'unsafe', label: 'I felt unsafe' },
  { key: 'payment', label: 'Payment problem' },
  { key: 'other', label: 'Something else' },
];

export interface CreateTaskInput {
  category: string;
  description?: string;
  hall?: string;
  when?: string;
  priceCents: number;
  study?: StudyRequest;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api/v1${path}`, {
    ...rest,
    credentials: 'same-origin',
    headers: json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: json !== undefined ? JSON.stringify(json) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    let code = 'HTTP_' + res.status;
    let message = 'Something went wrong — try again';
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiClientError(res.status, code, message);
  }
  return (await res.json()) as T;
}

export const api = {
  // --- auth ---
  requestCode: (email: string) =>
    call<{ sent: boolean; campus: string; devCode?: string }>('/auth/request-code', {
      method: 'POST',
      json: { email },
    }),
  verify: (email: string, code: string, name?: string) =>
    call<{ user: { id: string; name: string; email: string; campus: string } }>('/auth/verify', {
      method: 'POST',
      json: { email, code, ...(name ? { name } : {}) },
    }),
  logout: () => call<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => call<{ user: Me | null }>('/me'),

  // --- dev-only demo account switcher (inert unless RESEND_API_KEY is unset) ---
  devAccounts: () =>
    call<{ dev: boolean; accounts: { email: string; name: string; campus: string; hall: string | null }[] }>(
      '/auth/dev-accounts',
    ),
  devLogin: (email: string) =>
    call<{ user: { id: string; name: string; email: string; campus: string } }>('/auth/dev-login', {
      method: 'POST',
      json: { email },
    }),

  // --- tasks ---
  feed: () => call<{ tasks: ApiTask[] }>('/tasks'),
  myTasks: () => call<{ tasks: ApiTask[] }>('/tasks?mine=1'),
  createTask: (input: CreateTaskInput) => call<{ task: ApiTask }>('/tasks', { method: 'POST', json: input }),
  task: (id: string) => call<{ task: ApiTask }>(`/tasks/${id}`),
  cancelTask: (id: string) => call<{ cancelled: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  completeTask: (id: string) => call<{ completed: boolean }>(`/tasks/${id}/complete`, { method: 'POST' }),

  // --- offers / bargaining ---
  offers: (taskId: string) => call<{ offers: ApiOffer[] }>(`/tasks/${taskId}/offers`),
  makeOffer: (taskId: string, amountCents: number, message?: string) =>
    call<{ offer: ApiOffer }>(`/tasks/${taskId}/offers`, {
      method: 'POST',
      json: { amountCents, ...(message?.trim() ? { message: message.trim() } : {}) },
    }),
  counterOffer: (offerId: string, amountCents: number) =>
    call<{ offer: ApiOffer }>(`/offers/${offerId}/counter`, { method: 'POST', json: { amountCents } }),
  acceptOffer: (offerId: string) =>
    call<{ accepted: boolean; taskId: string }>(`/offers/${offerId}/accept`, { method: 'POST' }),
  withdrawOffer: (offerId: string) =>
    call<{ withdrawn: boolean }>(`/offers/${offerId}/withdraw`, { method: 'POST' }),
  declineOffer: (offerId: string) =>
    call<{ declined: boolean }>(`/offers/${offerId}/decline`, { method: 'POST' }),

  // --- deal off-ramps ---
  cancelAssignment: (taskId: string, reason?: string) =>
    call<{ cancelled: boolean }>(`/tasks/${taskId}/cancel-assignment`, {
      method: 'POST',
      json: { ...(reason?.trim() ? { reason: reason.trim() } : {}) },
    }),
  reportTask: (taskId: string, reason: ReportReason, details?: string) =>
    call<{ reported: boolean }>(`/tasks/${taskId}/report`, {
      method: 'POST',
      json: { reason, ...(details?.trim() ? { details: details.trim() } : {}) },
    }),

  // --- chat (opens once assigned) ---
  messages: (taskId: string) => call<{ messages: ApiMessage[] }>(`/tasks/${taskId}/messages`),
  sendMessage: (taskId: string, body: string) =>
    call<{ message: ApiMessage }>(`/tasks/${taskId}/messages`, { method: 'POST', json: { body } }),

  // --- reviews (after completion) ---
  reviews: (taskId: string) =>
    call<{ reviews: ApiReview[]; canReview: boolean }>(`/tasks/${taskId}/reviews`),
  review: (taskId: string, stars: number, comment?: string) =>
    call<{ review: { id: string; stars: number; comment: string | null } }>(`/tasks/${taskId}/reviews`, {
      method: 'POST',
      json: { stars, ...(comment?.trim() ? { comment: comment.trim() } : {}) },
    }),

  // --- notifications ---
  notifications: () => call<{ notifications: ApiNotification[]; unread: number }>('/notifications'),
  markNotificationsRead: () => call<{ ok: boolean }>('/notifications/read', { method: 'POST' }),
};
