/**
 * Campus email gate — re-exported from @campusbuddy/shared (single copy; the
 * backend seeds the campuses table from the same registry).
 */
export { CAMPUSES, campusForEmail, isCampusEmail, type Campus } from '@campusbuddy/shared';
import { campusForEmail as _campusForEmail } from '@campusbuddy/shared';

/** Backward-compatible NTU-only helper (kept for existing tests). */
export function isNtuEmail(email: string): boolean {
  return _campusForEmail(email)?.code === 'NTU';
}
