import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { isNtuEmail } from './ntu';

/**
 * Auth.js (NextAuth) config. The critical control is the NTU email allowlist in
 * the signIn callback — only verified NTU domains may register/sign in (docs/11).
 * This is also re-validated server-side on the API; never trust the client alone.
 */
export { isNtuEmail };

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
