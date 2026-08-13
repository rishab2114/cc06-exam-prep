import { z } from 'zod';
import { db } from '../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../lib/server/http';
import { notifyUser } from '../../../../../lib/server/notify';
import { rateLimit } from '../../../../../lib/server/rateLimit';
import { preferenceAcceptsRoom, type AirconPreference, type RoomType } from '../../../../../lib/hallSwap';

const Body = z.object({ profileId: z.string().uuid() });

function acceptsHall(wantedHalls: readonly string[], actualHall: string): boolean {
  return wantedHalls.length === 0 || wantedHalls.includes(actualHall);
}

function compatible(
  mine: { haveHall: string; haveRoomType: string; haveAircon: boolean; wantedHalls: string[]; wantedRoomTypes: string[]; wantedAircon: string; gender: string; term: string },
  theirs: { haveHall: string; haveRoomType: string; haveAircon: boolean; wantedHalls: string[]; wantedRoomTypes: string[]; wantedAircon: string; gender: string; term: string },
): boolean {
  return mine.gender === theirs.gender && mine.term === theirs.term &&
    acceptsHall(mine.wantedHalls, theirs.haveHall) &&
    acceptsHall(theirs.wantedHalls, mine.haveHall) &&
    preferenceAcceptsRoom(mine.wantedRoomTypes as RoomType[], mine.wantedAircon as AirconPreference, theirs.haveRoomType as RoomType, theirs.haveAircon) &&
    preferenceAcceptsRoom(theirs.wantedRoomTypes as RoomType[], theirs.wantedAircon as AirconPreference, mine.haveRoomType as RoomType, mine.haveAircon);
}

export const POST = handler(async (req, { session }) => {
  rateLimit(`hall-swap:intro:${session.sub}`, 10, 60_000);
  const { profileId } = await parseBody(req, Body);
  const [mine, theirs] = await Promise.all([
    db().hallSwapProfile.findUnique({ where: { userId: session.sub } }),
    db().hallSwapProfile.findUnique({ where: { id: profileId } }),
  ]);
  if (!mine?.isActive || !theirs?.isActive || theirs.campusId !== session.campusId || theirs.userId === session.sub) {
    fail(404, 'NO_MATCH', 'That hall-swap match is no longer available');
  }
  if (!compatible(mine, theirs)) fail(409, 'PREFERENCES_CHANGED', 'These preferences are no longer a reciprocal match');

  const reverse = await db().hallSwapConnection.findUnique({
    where: { requesterId_recipientId: { requesterId: theirs.userId, recipientId: session.sub } },
  });
  if (reverse) {
    const accepted = await db().hallSwapConnection.update({
      where: { id: reverse.id },
      data: { status: 'ACCEPTED' },
    });
    await notifyUser({
      userId: theirs.userId,
      type: 'hall_swap.intro_accepted',
      title: 'Your hall-swap introduction was accepted',
      body: 'You can now contact each other and submit the official NTU swap requests.',
      href: '/app/hall-swap',
    });
    return ok({ connectionId: accepted.id, status: accepted.status });
  }

  const connection = await db().hallSwapConnection.upsert({
    where: { requesterId_recipientId: { requesterId: session.sub, recipientId: theirs.userId } },
    update: { status: 'PENDING', campusId: session.campusId },
    create: { campusId: session.campusId, requesterId: session.sub, recipientId: theirs.userId },
  });
  await notifyUser({
    userId: theirs.userId,
    type: 'hall_swap.intro_requested',
    title: 'A hall-swap match wants to connect',
    body: `${mine.haveHall} matches your preferences. Accept only if you want to share contact details.`,
    href: '/app/hall-swap',
  });
  return ok({ connectionId: connection.id, status: connection.status });
});
