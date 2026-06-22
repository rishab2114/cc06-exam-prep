/**
 * Campus email allowlist — the gate that keeps the marketplace student-only.
 * Multi-campus: any recognised Singapore university domain is accepted. Lives in
 * its own module so both the server (Auth.js) and client (login form) can use it
 * without pulling server-only code into the browser bundle.
 */
export interface Campus {
  code: string;
  name: string;
  domains: string[];
}

// Launch order: SUTD is the first pilot campus, then the rest roll out.
export const CAMPUSES: Campus[] = [
  { code: 'SUTD', name: 'SUTD', domains: ['mymail.sutd.edu.sg', 'sutd.edu.sg'] },
  { code: 'NTU', name: 'NTU', domains: ['e.ntu.edu.sg', 'ntu.edu.sg', 'staff.main.ntu.edu.sg'] },
  { code: 'NUS', name: 'NUS', domains: ['u.nus.edu', 'nus.edu.sg'] },
  { code: 'SMU', name: 'SMU', domains: ['smu.edu.sg'] },
  { code: 'SIT', name: 'SIT', domains: ['singaporetech.edu.sg'] },
  { code: 'SUSS', name: 'SUSS', domains: ['suss.edu.sg'] },
];

function domainOf(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

/** The campus a student email belongs to, or undefined if not a recognised campus. */
export function campusForEmail(email: string): Campus | undefined {
  const domain = domainOf(email);
  return CAMPUSES.find((c) => c.domains.some((d) => domain === d || domain.endsWith(`.${d}`)));
}

/** True if the email belongs to any supported campus. */
export function isCampusEmail(email: string): boolean {
  return campusForEmail(email) !== undefined;
}

/** Backward-compatible NTU-only helper (kept for existing tests). */
export function isNtuEmail(email: string): boolean {
  return campusForEmail(email)?.code === 'NTU';
}
