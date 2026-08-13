import { handler, ok } from '../../../../../lib/server/http';
import { clearSessionCookie } from '../../../../../lib/server/auth';

export const POST = handler(
  async () => {
    clearSessionCookie();
    return ok({ ok: true });
  },
  { auth: false },
);
