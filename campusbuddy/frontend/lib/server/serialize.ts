import type { Task as SharedTask, StudyRequest } from '@campusbuddy/shared';
import type { Task, ServiceCategory, User, Offer } from '@prisma/client';

/**
 * DB rows -> the shared Task shape the UI already renders. One place decides
 * icons/display names/safety flags per category slug, so posted tasks slot into
 * the existing Explore cards and filters without UI changes.
 */
const SLUG_META: Record<string, { icon: string; display: string; presence: boolean; contactless: boolean; sameGenderDefault: boolean }> = {
  'room-cleaning': { icon: '🧹', display: 'Hostel Services', presence: true, contactless: false, sameGenderDefault: true },
  'deep-clean-inspection': { icon: '🧹', display: 'Hostel Services', presence: true, contactless: false, sameGenderDefault: true },
  'room-organization': { icon: '🧹', display: 'Hostel Services', presence: true, contactless: false, sameGenderDefault: true },
  'bedsheet-change': { icon: '🛏️', display: 'Hostel Services', presence: true, contactless: false, sameGenderDefault: true },
  'laundry-pickup': { icon: '🧺', display: 'Laundry', presence: false, contactless: true, sameGenderDefault: true },
  'laundry-wash': { icon: '🧺', display: 'Laundry', presence: false, contactless: true, sameGenderDefault: true },
  'laundry-dry': { icon: '🧺', display: 'Laundry', presence: false, contactless: true, sameGenderDefault: true },
  'laundry-iron': { icon: '🧺', display: 'Laundry', presence: false, contactless: true, sameGenderDefault: true },
  'laundry-fold': { icon: '🧺', display: 'Laundry', presence: false, contactless: true, sameGenderDefault: true },
  'grocery-shopping': { icon: '🛒', display: 'Convenience', presence: false, contactless: false, sameGenderDefault: false },
  'food-pickup': { icon: '🍜', display: 'Food', presence: false, contactless: false, sameGenderDefault: false },
  'meal-collection': { icon: '🍜', display: 'Food', presence: false, contactless: false, sameGenderDefault: false },
  'late-night-run': { icon: '🍜', display: 'Food', presence: false, contactless: false, sameGenderDefault: false },
  'spare-meal': { icon: '🍱', display: 'Food', presence: false, contactless: false, sameGenderDefault: false },
  'parcel-collection': { icon: '📦', display: 'Convenience', presence: false, contactless: false, sameGenderDefault: false },
  'proxy-collection': { icon: '📦', display: 'Convenience', presence: false, contactless: false, sameGenderDefault: false },
  'queue-standing': { icon: '🧍', display: 'Convenience', presence: false, contactless: false, sameGenderDefault: false },
  'printing-docs': { icon: '🖨️', display: 'Convenience', presence: false, contactless: false, sameGenderDefault: false },
  'hall-moving': { icon: '🧳', display: 'Moving', presence: true, contactless: false, sameGenderDefault: false },
  'luggage-carrying': { icon: '🧳', display: 'Moving', presence: true, contactless: false, sameGenderDefault: false },
  'study-help': { icon: '📚', display: 'Study help', presence: false, contactless: false, sameGenderDefault: false },
};

/** Form category label (what the UI posts) -> seeded category slug. */
export const FORM_CATEGORY_TO_SLUG: Record<string, string> = {
  'Room cleaning': 'room-cleaning',
  'Laundry pickup': 'laundry-pickup',
  'Spare home-cooked meal': 'spare-meal',
  'Grocery shopping': 'grocery-shopping',
  'Food delivery': 'food-pickup',
  'Parcel collection': 'parcel-collection',
  'Room shift & storage': 'hall-moving',
  'Study help / tutoring': 'study-help',
  'Late-night food run': 'late-night-run',
};

export type ApiTask = SharedTask & {
  status: string;
  kind: 'REQUEST' | 'OFFER';
  customerId: string;
  isMine: boolean;
  isProvider: boolean;
  offerCount: number;
};

export function taskToDto(
  t: Task & { category: ServiceCategory; customer: User; offers?: { id: string }[] },
  viewerId: string,
): ApiTask {
  const meta = SLUG_META[t.category.slug] ?? { icon: '🧩', display: t.category.groupName, presence: false, contactless: false, sameGenderDefault: false };
  return {
    id: t.id,
    icon: meta.icon,
    title: t.title,
    category: meta.display,
    priceCents: t.finalPriceCents ?? t.budgetCents,
    hall: t.hall ?? 'On campus',
    when: t.whenText ?? 'Flexible',
    customerName: t.customer.fullName,
    description: t.description ?? undefined,
    // distanceKm / customerGender / customerRating deliberately omitted — no geo,
    // no profile gender, and no customer reviews yet. We don't fake trust signals.
    tier: t.category.riskTier,
    requiresMatricVerification: t.category.riskTier !== 'T1',
    sameGenderOnly: meta.sameGenderDefault,
    presenceRequired: meta.presence,
    contactless: meta.contactless,
    study: (t.study as StudyRequest | null) ?? undefined,
    status: t.status,
    kind: t.kind,
    customerId: t.customerId,
    isMine: t.customerId === viewerId,
    isProvider: t.providerId === viewerId,
    offerCount: t.offers?.length ?? 0,
  };
}

export interface OfferDto {
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

export interface ProviderStats {
  rating: number | null; // avg published stars received, 1dp
  jobs: number; // completed tasks as provider
}

/** Rating + jobs-done for a set of users, in two grouped queries. */
export async function providerStatsFor(
  dbc: { review: { groupBy: Function }; task: { groupBy: Function } },
  userIds: string[],
): Promise<Map<string, ProviderStats>> {
  const map = new Map<string, ProviderStats>();
  if (userIds.length === 0) return map;
  const [ratings, jobs] = await Promise.all([
    dbc.review.groupBy({
      by: ['rateeId'],
      where: { rateeId: { in: userIds }, isPublished: true, deletedAt: null },
      _avg: { stars: true },
    }) as Promise<{ rateeId: string; _avg: { stars: number | null } }[]>,
    dbc.task.groupBy({
      by: ['providerId'],
      where: { providerId: { in: userIds }, status: 'COMPLETED' },
      _count: { _all: true },
    }) as Promise<{ providerId: string | null; _count: { _all: number } }[]>,
  ]);
  for (const id of userIds) map.set(id, { rating: null, jobs: 0 });
  for (const r of ratings) {
    map.get(r.rateeId)!.rating = r._avg.stars === null ? null : Math.round(r._avg.stars * 10) / 10;
  }
  for (const j of jobs) {
    if (j.providerId) map.get(j.providerId)!.jobs = j._count._all;
  }
  return map;
}

export function offerToDto(
  o: Offer & { provider: User },
  viewerId: string,
  taskCustomerId: string,
  stats?: ProviderStats,
): OfferDto {
  const open = o.state === 'PENDING' || o.state === 'COUNTERED';
  const viewerSide = viewerId === taskCustomerId ? 'CUSTOMER' : viewerId === o.providerId ? 'PROVIDER' : null;
  return {
    id: o.id,
    taskId: o.taskId,
    providerId: o.providerId,
    providerName: o.provider.fullName,
    amountCents: o.amountCents,
    round: o.round,
    state: o.state,
    lastActor: o.lastActor,
    message: o.message,
    yourTurn: open && viewerSide !== null && viewerSide !== o.lastActor,
    providerRating: stats?.rating ?? null,
    providerJobs: stats?.jobs ?? 0,
  };
}
