import { db } from '../../../../lib/server/db';
import { handler, ok } from '../../../../lib/server/http';

export const GET = handler(async (_req, { session }) => {
  const user = await db().user.findUnique({
    where: { id: session.sub },
    include: { campus: true },
  });
  return ok({
    user: user && {
      id: user.id,
      name: user.fullName,
      email: user.email,
      campus: user.campus.code,
      hall: user.hall,
      verifiedAt: user.emailVerifiedAt,
    },
  });
});
