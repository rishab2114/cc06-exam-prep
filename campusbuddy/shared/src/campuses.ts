/**
 * Campus registry + email gate — THE single copy (was duplicated in
 * frontend/lib/ntu.ts). The DB `campuses` table is seeded from the same list;
 * at runtime the backend reads the DB, the frontend reads this constant.
 */
export interface Campus {
  code: string;
  name: string;
  domains: string[];
}

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

/** The campus a student email belongs to, or undefined if not recognised. */
export function campusForEmail(email: string): Campus | undefined {
  const domain = domainOf(email);
  return CAMPUSES.find((c) => c.domains.some((d) => domain === d || domain.endsWith(`.${d}`)));
}

/** True if the email belongs to any supported campus. */
export function isCampusEmail(email: string): boolean {
  return campusForEmail(email) !== undefined;
}
