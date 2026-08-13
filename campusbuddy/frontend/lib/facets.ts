import type { ApiTask } from './api';

/**
 * Category-aware filters ("facets").
 *
 * A flat filter list gets useless fast: a tutor hunting MH1810 shouldn't wade
 * through laundry, and "contactless" is meaningless on a study session. So each
 * category declares which facets apply, and each facet knows how to read its
 * value off a task. Values are derived from the tasks actually in the feed, so
 * we never show a filter that would return nothing.
 */
export type FacetKey = 'course' | 'level' | 'format' | 'hall';

export interface FacetDef {
  key: FacetKey;
  label: string;
  /** The value this task has for the facet, or null if it doesn't have one. */
  valueOf: (t: ApiTask) => string | null;
}

/**
 * NTU course codes are 2–4 letters + 4 digits (MH1810, CZ1003, HW0188). Posts
 * write the module freehand ("MH1810 Mathematics I"), so pull the code out and
 * group by it — that's the thing people actually search for.
 */
export function courseCodeOf(module?: string | null): string | null {
  const m = module?.match(/\b([A-Za-z]{2,4}\s?\d{4})\b/);
  return m ? m[1].replace(/\s+/g, '').toUpperCase() : null;
}

export const FACETS: Record<FacetKey, FacetDef> = {
  course: {
    key: 'course',
    label: 'Course',
    valueOf: (t) => courseCodeOf(t.study?.module),
  },
  level: {
    key: 'level',
    label: 'Level',
    valueOf: (t) => t.study?.level ?? null,
  },
  format: {
    key: 'format',
    label: 'Format',
    // Stored with a leading emoji from the post form ("📍 In person (library)").
    valueOf: (t) => t.study?.format?.replace(/^[^\p{L}]+/u, '').trim() || null,
  },
  hall: {
    key: 'hall',
    label: 'Where',
    valueOf: (t) => (t.hall && t.hall !== 'On campus' ? t.hall : null),
  },
};

/**
 * Which facets a category exposes. Anything unlisted just gets `hall`, which is
 * the one dimension that applies to every errand.
 */
const BY_CATEGORY: Record<string, FacetKey[]> = {
  'Study help': ['course', 'level', 'format'],
  Laundry: ['hall'],
  'Hostel Services': ['hall'],
  Food: ['hall'],
  Convenience: ['hall'],
  Moving: ['hall'],
};

export function facetsFor(category: string): FacetDef[] {
  if (category === 'All') return [];
  return (BY_CATEGORY[category] ?? ['hall']).map((k) => FACETS[k]);
}

/** Distinct values for a facet across the given tasks, most common first. */
export function facetValues(tasks: ApiTask[], facet: FacetDef): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const v = facet.valueOf(t);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
