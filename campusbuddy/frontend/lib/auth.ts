import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';

/**
 * Auth.js (NextAuth) config. The critical control is the NTU email allowlist in
 * the signIn callback — only verified NTU domains may register/sign in (docs/11).
 * This is also re-validated server-side on the API; never trust the client alone.
 */
const NTU_DOMAINS = (process.env.NTU_EMAIL_DOMAINS ?? 'e.ntu.edu.sg,ntu.edu.sg')
  .split(',')
  .map((d) => d.trim().toLowerCase());

export function isNtuEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return NTU_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Gate: only NTU students may join.
      return !!user.email && isNtuEmail(user.email);
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
  },
};
