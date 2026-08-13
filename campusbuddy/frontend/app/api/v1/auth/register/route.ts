import { z } from 'zod';
import { campusForEmail } from '@campusbuddy/shared';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { createSessionCookie } from '../../../../../lib/server/auth';
import { hashPassword, passwordProblem } from '../../../../../lib/server/password';
import { rateLimit } from '../../../../../lib/server/rateLimit';

const Body = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(60),
});

// POST /api/v1/auth/register — create an account with a campus email + password.
//
// The campus gate is a DOMAIN check: it proves the address belongs to a
// university we support, not that the person owns it (that needs an emailed
// code, which this deployment can't send yet). So we leave emailVerifiedAt null
// — the UI must not claim these accounts are verified.
export const POST = handler(
  async (req) => {
    const { email, password, name } = await parseBody(req, Body);
    const cleaned = email.trim().toLowerCase();

    // Keyed on the address so one person can't grind through accounts.
    rateLimit(`auth:register:${cleaned}`, 5, 10 * 60_000);

    const campus = campusForEmail(cleaned);
    if (!campus) fail(403, 'NOT_CAMPUS_EMAIL', 'Use your university email (e.g. yourname@e.ntu.edu.sg)');

    const problem = passwordProblem(password);
    if (problem) fail(400, 'WEAK_PASSWORD', problem);

    const campusRow = await db().campus.findUnique({ where: { code: campus.code } });
    if (!campusRow) fail(500, 'CAMPUS_MISSING', 'Campus not provisioned — contact support');

    const existing = await db().user.findUnique({
      where: { email: cleaned },
      select: { id: true, passwordHash: true },
    });
    if (existing) {
      // Don't reveal whether the account has a password set — either way the
      // right next step for a real owner is to sign in.
      fail(409, 'ACCOUNT_EXISTS', 'That email already has an account — sign in instead');
    }

    const user = await db().user.create({
      data: {
        email: cleaned,
        fullName: name.trim(),
        passwordHash: await hashPassword(password),
        campusId: campusRow.id,
      },
      include: { campus: true },
    });

    await createSessionCookie({
      sub: user.id,
      email: user.email,
      name: user.fullName,
      campusId: user.campusId,
      campusCode: user.campus.code,
    });
    return ok(
      { user: { id: user.id, name: user.fullName, email: user.email, campus: user.campus.code } },
      201,
    );
  },
  { auth: false },
);
