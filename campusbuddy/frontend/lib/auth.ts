import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { isCampusEmail } from './ntu';

/**
 * Auth.js (NextAuth) config. The critical control is the campus email allowlist in
 * the signIn callback — only verified Singapore university domains may register/sign
 * in (docs/11). This is also re-validated server-side on the API; never trust the
 * client alone.
 */
export { isCampusEmail };

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Gate: only verified campus students may join.
      return !!user.email && isCampusEmail(user.email);
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
  },
};
