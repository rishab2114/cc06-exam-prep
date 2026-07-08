import { z } from 'zod';
import { db } from '../../../../lib/server/db';
import { handler, ok, fail, parseBody } from '../../../../lib/server/http';
import { taskToDto, FORM_CATEGORY_TO_SLUG } from '../../../../lib/server/serialize';
import { publishToCampus } from '../../../../lib/server/events';
import { rateLimit } from '../../../../lib/server/rateLimit';

const MAX_PAGE = 50;
const DEFAULT_PAGE = 24;

// GET /api/v1/tasks — campus-scoped feed. ?mine=1 for the caller's own posts,
// ?scope=history for past tasks either side. The default (open) feed supports
// cursor pagination — ?cursor=<taskId>&limit=<n> — since it's the one that
// grows unbounded with real campus volume; mine/history stay single-page
// (they're inherently bounded to what one student is involved in).
export const GET = handler(async (req, { session }) => {
  const url = new URL(req.url);
  const mine = url.searchParams.get('mine') === '1';
  const history = url.searchParams.get('scope') === 'history';
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(MAX_PAGE, Math.max(1, Number(url.searchParams.get('limit')) || DEFAULT_PAGE));

  const tasks = await db().task.findMany({
    where: {
      campusId: session.campusId,
      ...(history
        ? {
            // Past tasks I was part of, either side. Includes soft-deleted
            // (cancelled) rows — history is exactly where those belong.
            OR: [{ customerId: session.sub }, { providerId: session.sub }],
            status: { in: ['COMPLETED', 'CANCELLED', 'DISPUTED'] },
          }
        : mine
          ? { deletedAt: null, customerId: session.sub, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }
          : { deletedAt: null, status: 'OPEN' }),
    },
    include: { category: true, customer: true, offers: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
    take: history || mine ? 100 : limit + 1,
    ...(cursor && !history && !mine ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  if (history || mine) {
    return ok({ tasks: tasks.map((t) => taskToDto(t, session.sub)), nextCursor: null });
  }
  const hasMore = tasks.length > limit;
  const page = hasMore ? tasks.slice(0, limit) : tasks;
  return ok({
    tasks: page.map((t) => taskToDto(t, session.sub)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

const CreateBody = z.object({
  category: z.string().refine((c) => c in FORM_CATEGORY_TO_SLUG, 'Unknown category'),
  title: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  hall: z.string().max(60).optional(),
  when: z.string().max(40).optional(),
  priceCents: z.number().int().min(1).max(99900),
  study: z
    .object({
      module: z.string().min(1).max(80),
      topics: z.array(z.string().max(80)).max(5),
      level: z.string().max(40),
      helpTypes: z.array(z.string().max(40)).max(4),
      goal: z.string().max(120),
      format: z.string().max(40),
    })
    .optional(),
});

// POST /api/v1/tasks — free to post; task goes live on the caller's campus.
export const POST = handler(async (req, { session }) => {
  const body = await parseBody(req, CreateBody);
  rateLimit(`task:create:${session.sub}`, 8, 60_000);
  const slug = FORM_CATEGORY_TO_SLUG[body.category];
  const category = await db().serviceCategory.findUnique({ where: { slug } });
  if (!category || !category.isActive) fail(400, 'BAD_CATEGORY', 'That service is not available');

  const title =
    body.study?.module?.slice(0, 60).concat(' — study help') ??
    (body.description?.trim() ? body.description.trim().slice(0, 60) : body.category);

  const task = await db().task.create({
    data: {
      campusId: session.campusId,
      customerId: session.sub,
      categoryId: category.id,
      title,
      description: body.description ?? null,
      hall: body.hall ?? null,
      whenText: body.when ?? null,
      budgetCents: body.priceCents,
      status: 'OPEN',
      study: body.study ?? undefined,
      events: { create: { actorId: session.sub, toStatus: 'OPEN' } },
    },
    include: { category: true, customer: true, offers: { select: { id: true } } },
  });
  publishToCampus(session.campusId, { kind: 'task', taskId: task.id }); // fresh post hits every Explore live
  return ok({ task: taskToDto(task, session.sub) }, 201);
});
