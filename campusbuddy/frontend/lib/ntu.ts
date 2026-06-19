/**
 * NTU email allowlist check — the gate that keeps the marketplace student-only.
 * Lives in its own module so both the server (Auth.js) and client (login form)
 * can use it without pulling server-only code into the browser bundle.
 */
const NTU_DOMAINS = (
  process.env.NEXT_PUBLIC_NTU_EMAIL_DOMAINS ??
  process.env.NTU_EMAIL_DOMAINS ??
  'e.ntu.edu.sg,ntu.edu.sg,staff.main.ntu.edu.sg'
)
  .split(',')
  .map((d) => d.trim().toLowerCase());

export function isNtuEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return NTU_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}
