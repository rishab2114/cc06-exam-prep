import { z } from 'zod';
import { db } from '../../../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../../../lib/server/http';

// Two-sided reviews on a completed task: the poster rates the buddy, the buddy
// rates the poster. One review per side (DB unique). Published immediately for
// pilot liveliness; double-blind release is a Phase 3 switch.

// GET — both reviews on this task plus whether the viewer still owes one.
export const GET = handler(async (_req, { params, session }) => {
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');

  const reviews = await db().review.findMany({
    where: { taskId: task.id, deletedAt: null },
    include: { rater: { select: { fullName: true } } },
  });
  const isParty = session.sub === task.customerId || session.sub === task.providerId;
  return ok({
    reviews: reviews.map((r) => ({
      id: r.id,
      raterId: r.raterId,
      raterName: r.rater.fullName,
      stars: r.stars,
      comment: r.comment,
      mine: r.raterId === session.sub,
    })),
    canReview:
      isParty && task.status === 'COMPLETED' && !reviews.some((r) => r.raterId === session.sub),
  });
});

const Body = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(300).optional(),
});

export const POST = handler(async (req, { params, session }) => {
  const { stars, comment } = await parseBody(req, Body);
  const task = await db().task.findFirst({
    where: { id: params.id, campusId: session.campusId },
  });
  if (!task) fail(404, 'NOT_FOUND', 'Task not found');
  if (task.status !== 'COMPLETED') fail(409, 'NOT_COMPLETED', 'You can review once the task is done');
  const isCustomer = session.sub === task.customerId;
  const isProvider = session.sub === task.providerId;
  if (!isCustomer && !isProvider) fail(403, 'FORBIDDEN', 'Only the poster and their buddy can review');

  const rateeId = isCustomer ? task.providerId! : task.customerId;
  const existing = await db().review.findUnique({
    where: { taskId_raterId: { taskId: task.id, raterId: session.sub } },
  });
  if (existing) fail(409, 'ALREADY_REVIEWED', 'You already reviewed this task');

  const review = await db().review.create({
    data: {
      taskId: task.id,
      raterId: session.sub,
      rateeId,
      stars,
      comment: comment || null,
      isPublished: true,
    },
  });
  await db().notification.create({
    data: {
      userId: rateeId,
      type: 'review.new',
      title: `${session.name} rated you ${'⭐'.repeat(stars)} on “${task.title}”`,
      ...(comment ? { body: `“${comment}”` } : {}),
      data: { taskId: task.id },
    },
  });
  return ok({ review: { id: review.id, stars: review.stars, comment: review.comment } }, 201);
});
