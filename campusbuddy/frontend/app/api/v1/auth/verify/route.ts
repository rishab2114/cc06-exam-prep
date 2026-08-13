import { z } from 'zod';
import { campusForEmail } from '@campusbuddy/shared';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { hashLoginCode, createSessionCookie } from '../../../../../lib/server/auth';

const Body = z.object({
  email: z.string().email().max(120),
  code: z.string().regex(/^\d{6}$/, 'Code is 6 digits'),
  name: z.string().min(1).max(60).optional(),
});

// Step 2: verify the code, upsert the user under their campus, set the session.
export const POST = handler(
  async (req) => {
    const { email, code, name } = await parseBody(req, Body);
    const cleaned = email.trim().toLowerCase();

    const row = await db().loginCode.findFirst({
      where: {
        email: cleaned,
        codeHash: hashLoginCode(cleaned, code),
        expiresAt: { gt: new Date() },
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) fail(401, 'BAD_CODE', 'That code is wrong or expired — request a new one');
    await db().loginCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });

    const campus = campusForEmail(cleaned);
    if (!campus) fail(403, 'NOT_CAMPUS_EMAIL', 'Use your university email to join');
    const campusRow = await db().campus.findUnique({ where: { code: campus.code } });
    if (!campusRow) fail(500, 'CAMPUS_MISSING', 'Campus not provisioned — contact support');

    const existed = await db().user.findUnique({ where: { email: cleaned }, select: { id: true } });
    const fallbackName = cleaned.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Student';
    const user = await db().user.upsert({
      where: { email: cleaned },
      update: { emailVerifiedAt: new Date(), ...(name ? { fullName: name } : {}) },
      create: {
        email: cleaned,
        fullName: name ?? fallbackName,
        emailVerifiedAt: new Date(),
        campusId: campusRow.id,
      },
    });
    if (user.isSuspended) fail(403, 'SUSPENDED', 'This account is suspended');

    await createSessionCookie({
      sub: user.id,
      email: user.email,
      name: user.fullName,
      campusId: user.campusId,
      campusCode: campusRow.code,
    });
    return ok({
      user: { id: user.id, name: user.fullName, email: user.email, campus: campusRow.code },
      isNewUser: !existed,
    });
  },
  { auth: false },
);
