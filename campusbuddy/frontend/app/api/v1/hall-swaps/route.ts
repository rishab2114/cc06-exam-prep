import { z } from 'zod';
import { db } from '../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../lib/server/http';
import { notifyUser } from '../../../../lib/server/notify';
import { rateLimit } from '../../../../lib/server/rateLimit';
import {
  AIRCON_PREFERENCES,
  HALL_SWAP_TERMS,
  NTU_HALLS,
  ROOM_TYPES,
  preferenceAcceptsRoom,
  type AirconPreference,
  type RoomType,
} from '../../../../lib/hallSwap';

export const dynamic = 'force-dynamic';

const Hall = z.enum(NTU_HALLS);
const Room = z.enum(ROOM_TYPES);
const Aircon = z.enum(AIRCON_PREFERENCES);

const Body = z.object({
  gender: z.enum(['MALE', 'FEMALE']),
  term: z.enum(HALL_SWAP_TERMS),
  haveHall: Hall,
  haveRoomType: Room,
  haveAircon: z.boolean(),
  wantedHalls: z.array(Hall).max(NTU_HALLS.length).transform((items) => [...new Set(items)]),
  wantedRoomTypes: z.array(Room).min(1, 'Choose at least one room type').max(ROOM_TYPES.length)
    .transform((items) => [...new Set(items)]),
  wantedAircon: Aircon,
});

type SwapRow = {
  id: string;
  userId: string;
  gender: string;
  term: string;
  haveHall: string;
  haveRoomType: string;
  haveAircon: boolean;
  wantedHalls: string[];
  wantedRoomTypes: string[];
  wantedAircon: string;
  user: { fullName: string };
};

function acceptsHall(wantedHalls: readonly string[], actualHall: string): boolean {
  return wantedHalls.length === 0 || wantedHalls.includes(actualHall);
}

function reciprocalMatch(mine: SwapRow, candidate: SwapRow): boolean {
  return (
    acceptsHall(mine.wantedHalls, candidate.haveHall) &&
    preferenceAcceptsRoom(
      mine.wantedRoomTypes as RoomType[],
      mine.wantedAircon as AirconPreference,
      candidate.haveRoomType as RoomType,
      candidate.haveAircon,
    ) &&
    acceptsHall(candidate.wantedHalls, mine.haveHall) &&
    preferenceAcceptsRoom(
      candidate.wantedRoomTypes as RoomType[],
      candidate.wantedAircon as AirconPreference,
      mine.haveRoomType as RoomType,
      mine.haveAircon,
    )
  );
}

function isExact(mine: SwapRow, candidate: SwapRow): boolean {
  return (
    mine.wantedHalls.length === 1 &&
    candidate.wantedHalls.length === 1 &&
    mine.wantedRoomTypes.length === 1 &&
    candidate.wantedRoomTypes.length === 1 &&
    mine.wantedAircon !== 'ANY' &&
    candidate.wantedAircon !== 'ANY'
  );
}

function toProfile(row: Omit<SwapRow, 'user'> & { isActive: boolean }) {
  return {
    gender: row.gender,
    term: row.term,
    haveHall: row.haveHall,
    haveRoomType: row.haveRoomType,
    haveAircon: row.haveAircon,
    wantedHalls: row.wantedHalls,
    wantedRoomTypes: row.wantedRoomTypes,
    wantedAircon: row.wantedAircon,
    isActive: row.isActive,
  };
}

async function connectionStateFor(userId: string, campusId: string) {
  const rows = await db().hallSwapConnection.findMany({
    where: {
      campusId,
      OR: [{ requesterId: userId }, { recipientId: userId }],
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
    include: {
      requester: { select: { fullName: true, email: true, hallSwapProfile: true } },
      recipient: { select: { fullName: true, email: true, hallSwapProfile: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const byOtherUser = new Map<string, (typeof rows)[number]>();
  const connections = rows.map((row) => {
    const outgoing = row.requesterId === userId;
    const other = outgoing ? row.recipient : row.requester;
    const otherId = outgoing ? row.recipientId : row.requesterId;
    byOtherUser.set(otherId, row);
    return {
      id: row.id,
      status: row.status,
      direction: outgoing ? ('OUTGOING' as const) : ('INCOMING' as const),
      firstName: other.fullName.trim().split(/\s+/)[0] || 'Student',
      room: other.hallSwapProfile
        ? `${other.hallSwapProfile.haveHall} · ${other.hallSwapProfile.haveRoomType === 'SINGLE' ? 'Single' : 'Double'} · ${other.hallSwapProfile.haveAircon ? 'Air-con' : 'Non-air-con'}`
        : 'Hall preference',
      ...(row.status === 'ACCEPTED' ? { contact: { name: other.fullName, email: other.email } } : {}),
    };
  });
  return { byOtherUser, connections };
}

async function matchesFor(userId: string, campusId: string) {
  const mine = await db().hallSwapProfile.findUnique({
    where: { userId },
    include: { user: { select: { fullName: true } } },
  });
  if (!mine || !mine.isActive) return { profile: mine, matches: [], activeProfiles: 0 };

  const candidates = await db().hallSwapProfile.findMany({
    where: {
      campusId,
      gender: mine.gender,
      term: mine.term,
      isActive: true,
      userId: { not: userId },
    },
    include: { user: { select: { fullName: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const matches = candidates
    .filter((candidate) => reciprocalMatch(mine, candidate))
    .map((candidate) => ({
      id: candidate.id,
      userId: candidate.userId,
      firstName: candidate.user.fullName.trim().split(/\s+/)[0] || 'Student',
      haveHall: candidate.haveHall,
      haveRoomType: candidate.haveRoomType,
      haveAircon: candidate.haveAircon,
      term: candidate.term,
      matchType: isExact(mine, candidate) ? ('EXACT' as const) : ('FLEXIBLE' as const),
      matchedOn: [
        `Their ${candidate.haveHall} room fits your preferences`,
        `Your ${mine.haveHall} room fits theirs`,
      ],
    }))
    .sort((a, b) => Number(b.matchType === 'EXACT') - Number(a.matchType === 'EXACT'));

  return { profile: mine, matches, activeProfiles: candidates.length + 1 };
}

// GET /api/v1/hall-swaps — the user's structured preference and reciprocal
// matches only. Exact room numbers, email addresses, and contact details never
// enter the public match payload.
export const GET = handler(async (_req, { session }) => {
  const result = await matchesFor(session.sub, session.campusId);
  const connectionState = await connectionStateFor(session.sub, session.campusId);
  return ok({
    profile: result.profile ? toProfile(result.profile) : null,
    matches: result.matches.map(({ userId, ...match }) => {
      const connection = connectionState.byOtherUser.get(userId);
      const outgoing = connection?.requesterId === session.sub;
      return {
        ...match,
        connectionStatus: !connection
          ? 'NONE'
          : connection.status === 'ACCEPTED'
            ? 'CONNECTED'
            : outgoing
              ? 'SENT'
              : 'RECEIVED',
        ...(connection?.status === 'ACCEPTED'
          ? {
              contact: {
                name: outgoing ? connection.recipient.fullName : connection.requester.fullName,
                email: outgoing ? connection.recipient.email : connection.requester.email,
              },
            }
          : {}),
      };
    }),
    connections: connectionState.connections,
    activeProfiles: result.activeProfiles,
  });
});

// POST /api/v1/hall-swaps — create or replace one active preference profile.
// Saving and matching are free; there is deliberately no rent/top-up field.
export const POST = handler(async (req, { session }) => {
  rateLimit(`hall-swap:save:${session.sub}`, 6, 60_000);
  if (session.campusCode !== 'NTU') {
    fail(403, 'NTU_ONLY', 'The Hall Swap Matcher is currently available for NTU students only');
  }
  const body = await parseBody(req, Body);

  const saved = await db().hallSwapProfile.upsert({
    where: { userId: session.sub },
    update: { ...body, campusId: session.campusId, isActive: true },
    create: { ...body, campusId: session.campusId, userId: session.sub },
  });
  const result = await matchesFor(session.sub, session.campusId);
  const connectionState = await connectionStateFor(session.sub, session.campusId);

  // Tell reciprocal matches, but suppress repeat alerts from the same saved
  // profile for 24 hours so editing preferences does not create notification
  // spam. The current user sees their results immediately on this page.
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  await Promise.all(
    result.matches.slice(0, 25).map(async (match) => {
      const alreadyNotified = await db().notification.findFirst({
        where: {
          userId: match.userId,
          type: 'hall_swap.match',
          createdAt: { gte: since },
          data: { path: ['swapProfileId'], equals: saved.id },
        },
        select: { id: true },
      });
      if (alreadyNotified) return;
      await notifyUser({
        userId: match.userId,
        type: 'hall_swap.match',
        title: 'New reciprocal hall-swap match',
        body: `A verified student with ${saved.haveHall} wants a room like yours.`,
        href: '/app/hall-swap',
        meta: { swapProfileId: saved.id },
      });
    }),
  );

  return ok({
    profile: toProfile(saved),
    matches: result.matches.map(({ userId, ...match }) => {
      const connection = connectionState.byOtherUser.get(userId);
      const outgoing = connection?.requesterId === session.sub;
      return {
        ...match,
        connectionStatus: !connection
          ? 'NONE'
          : connection.status === 'ACCEPTED'
            ? 'CONNECTED'
            : outgoing
              ? 'SENT'
              : 'RECEIVED',
        ...(connection?.status === 'ACCEPTED'
          ? {
              contact: {
                name: outgoing ? connection.recipient.fullName : connection.requester.fullName,
                email: outgoing ? connection.recipient.email : connection.requester.email,
              },
            }
          : {}),
      };
    }),
    connections: connectionState.connections,
    activeProfiles: result.activeProfiles,
  });
});

// DELETE /api/v1/hall-swaps — pause matching without destroying preferences.
export const DELETE = handler(async (_req, { session }) => {
  await db().hallSwapProfile.updateMany({
    where: { userId: session.sub },
    data: { isActive: false },
  });
  return ok({ paused: true });
});
