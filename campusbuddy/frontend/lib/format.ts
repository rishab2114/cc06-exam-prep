/**
 * Display helpers — now thin re-exports of @campusbuddy/shared, THE single copy
 * of the money math (the backend binds the same functions). Never re-implement
 * fee logic here.
 */
export { formatSgd, feeBreakdown, parseSgdToCents } from '@campusbuddy/shared';
