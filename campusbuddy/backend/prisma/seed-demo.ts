import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Demo seed — makes the marketplace playable with one person at a keyboard.
 *
 * Creates 3 verified NTU students and a spread of freshly-posted tasks so that
 * whichever demo account you log in as, you immediately see *other people's*
 * posts to offer on, plus your own to manage. One task is pre-completed with
 * reviews on both sides so provider reputation (⭐ + jobs) shows up right away.
 *
 * Idempotent and repeatable: every run wipes the demo objects and rebuilds them,
 * so `npm run prisma:seed:demo` always gives you a clean playground (all live
 * tasks back to OPEN, offers/chat/reviews reset).
 *
 * Pair it with the dev account switcher on the login screen (available whenever
 * RESEND_API_KEY is unset) to hop between these students without email codes.
 */

const CAMPUS_CODE = 'NTU';

const USERS = [
  { id: 'demo-user-priya', email: 'priya@e.ntu.edu.sg', fullName: 'Priya S', hall: 'Hall 9' },
  { id: 'demo-user-wei', email: 'wei@e.ntu.edu.sg', fullName: 'Wei Lim', hall: 'Crescent Hall' },
  { id: 'demo-user-arjun', email: 'arjun@e.ntu.edu.sg', fullName: 'Arjun Rao', hall: 'Binjai Hall' },
] as const;

// Recently-posted OPEN tasks. `mins` = minutes ago, so the feed shows a
// realistic "just now / 20m ago" spread ordered newest-first.
const TASKS = [
  { id: 'demo-task-clean', by: 'demo-user-priya', slug: 'room-cleaning', budget: 1800, mins: 8,
    title: 'Clean my room before block inspection', hall: 'Hall 9', when: 'Today 6–8pm',
    description: 'Bathroom + floor + empty bins before Friday inspection. I’ll be in the room.' },
  { id: 'demo-task-parcel', by: 'demo-user-priya', slug: 'parcel-collection', budget: 500, mins: 26,
    title: 'Grab my Amazon parcel from the hall counter', hall: 'Hall 9 mailroom', when: 'Before 9pm today',
    description: 'One small box, I’ll share the pickup code. Drop outside my door — contactless is fine.' },
  { id: 'demo-task-laundry', by: 'demo-user-wei', slug: 'laundry-pickup', budget: 1000, mins: 42,
    title: 'Laundry wash & fold — bag’s outside my door', hall: 'Crescent Hall', when: 'Anytime today',
    description: 'One bag, colours. Wash, dry, fold, text me when it’s back. No room entry needed.' },
  { id: 'demo-task-meal', by: 'demo-user-wei', slug: 'spare-meal', budget: 600, mins: 70,
    title: 'Spare portion of home-cooked butter chicken 🍛', hall: 'Crescent Hall pantry', when: 'Dinner, 7pm',
    description: 'Cooking a big batch tonight — one extra container going spare if anyone’s keen.' },
  { id: 'demo-task-study', by: 'demo-user-arjun', slug: 'study-help', budget: 2500, mins: 95,
    title: 'MH1810 Calculus — integration help before midterm', hall: 'Library, level 3', when: 'This week',
    description: 'Stuck on integration by parts and definite integrals. Want to work through past-paper Qs.',
    study: {
      module: 'MH1810 Mathematics I',
      topics: ['Integration by parts', 'Definite integrals'],
      level: 'Intermediate',
      helpTypes: ['💡 Explain concepts', '📄 Past-paper practice'],
      goal: 'Feel confident on the integration section of the midterm',
      format: '📍 In person (library)',
    } },
  { id: 'demo-task-supper', by: 'demo-user-arjun', slug: 'late-night-run', budget: 700, mins: 130,
    title: 'Late-night McDonald’s supper run', hall: 'Binjai Hall', when: 'Tonight after 11pm',
    description: 'McSpicy meal + fries. I’ll PayNow on delivery. Keep the change for the trip 🙏' },
] as const;

const GIGS = [
  { id: 'demo-gig-organise', by: 'demo-user-priya', slug: 'room-organization', budget: 1600, mins: 18,
    title: 'Hall-room reset: declutter + organise', hall: 'Any NTU hall', when: 'Weekend afternoons',
    description: 'A focused one-hour reset for desks, wardrobes and move-in clutter. You stay in the room while we sort.' },
  { id: 'demo-gig-laundry', by: 'demo-user-wei', slug: 'laundry-wash', budget: 1200, mins: 36,
    title: 'Same-day laundry wash, dry & fold', hall: 'Crescent Hall', when: 'Weekdays after 4pm',
    description: 'One standard bag, contactless pickup and return around Crescent and Pioneer halls.' },
  { id: 'demo-gig-calculus', by: 'demo-user-arjun', slug: 'study-help', budget: 2200, mins: 58,
    title: 'MH1810 calculus revision — 1:1 tutoring', hall: 'Lee Wee Nam Library', when: 'Weekday evenings',
    description: 'Concept explanations and past-paper practice for limits, differentiation and integration. Tutoring only.' },
] as const;

async function main() {
  const campus = await prisma.campus.findUnique({ where: { code: CAMPUS_CODE } });
  if (!campus) throw new Error(`Campus ${CAMPUS_CODE} not found — run the base seed (prisma:seed) first.`);

  const allTaskIds = [...TASKS.map((t) => t.id), ...GIGS.map((g) => g.id), 'demo-task-history'];
  const userIds = USERS.map((u) => u.id);

  // --- wipe prior demo state so the playground is fresh & repeatable ---
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.message.deleteMany({ where: { taskId: { in: allTaskIds } } });
  await prisma.review.deleteMany({ where: { taskId: { in: allTaskIds } } });
  await prisma.dispute.deleteMany({ where: { taskId: { in: allTaskIds } } });
  await prisma.safetyEvent.deleteMany({ where: { taskId: { in: allTaskIds } } });
  await prisma.taskEvent.deleteMany({ where: { taskId: { in: allTaskIds } } });
  await prisma.offer.deleteMany({ where: { taskId: { in: allTaskIds } } });
  await prisma.task.deleteMany({ where: { id: { in: allTaskIds } } });

  // --- users (verified NTU students) ---
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { id: u.id, fullName: u.fullName, hall: u.hall, emailVerifiedAt: new Date(), campusId: campus.id, isSuspended: false },
      create: { id: u.id, email: u.email, fullName: u.fullName, hall: u.hall, emailVerifiedAt: new Date(), campusId: campus.id },
    });
  }

  // --- categories we reference, by slug ---
  const slugs = Array.from(new Set([...TASKS.map((t) => t.slug), ...GIGS.map((g) => g.slug)]));
  const cats = await prisma.serviceCategory.findMany({ where: { slug: { in: slugs } } });
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));
  const missing = slugs.filter((s) => !catBySlug.has(s));
  if (missing.length) throw new Error(`Missing categories ${missing.join(', ')} — run the base seed first.`);

  // --- fresh OPEN tasks ---
  for (const t of TASKS) {
    const created = new Date(Date.now() - t.mins * 60_000);
    const cat = catBySlug.get(t.slug)!;
    await prisma.task.create({
      data: {
        id: t.id,
        campusId: campus.id,
        customerId: t.by,
        categoryId: cat.id,
        title: t.title,
        description: t.description,
        hall: t.hall,
        whenText: t.when,
        budgetCents: t.budget,
        status: 'OPEN',
        study: 'study' in t ? (t.study as object) : undefined,
        createdAt: created,
        events: { create: { actorId: t.by, toStatus: 'OPEN', createdAt: created } },
      },
    });
  }

  // --- sample freelance services (TaskKind.OFFER) ---
  for (const g of GIGS) {
    const created = new Date(Date.now() - g.mins * 60_000);
    const cat = catBySlug.get(g.slug)!;
    await prisma.task.create({
      data: {
        id: g.id,
        campusId: campus.id,
        customerId: g.by,
        categoryId: cat.id,
        kind: 'OFFER',
        title: g.title,
        description: g.description,
        hall: g.hall,
        whenText: g.when,
        budgetCents: g.budget,
        status: 'OPEN',
        createdAt: created,
        events: { create: { actorId: g.by, toStatus: 'OPEN', createdAt: created } },
      },
    });
  }

  // --- one finished job so reputation is visible: Wei cleaned for Priya, both 5★ ---
  const cleanCat = catBySlug.get('room-cleaning')!;
  const past = new Date(Date.now() - 3 * 24 * 3600_000);
  await prisma.task.create({
    data: {
      id: 'demo-task-history',
      campusId: campus.id,
      customerId: 'demo-user-priya',
      providerId: 'demo-user-wei',
      categoryId: cleanCat.id,
      title: 'Room clean before I flew home for break',
      description: 'Full clean while I packed. Went great.',
      hall: 'Hall 9',
      whenText: 'Last Sunday',
      budgetCents: 2000,
      finalPriceCents: 2000,
      status: 'COMPLETED',
      createdAt: past,
      assignedAt: past,
      completedAt: past,
    },
  });
  await prisma.offer.create({
    data: {
      id: 'demo-offer-history',
      taskId: 'demo-task-history',
      providerId: 'demo-user-wei',
      amountCents: 2000,
      round: 1,
      state: 'ACCEPTED',
      lastActor: 'CUSTOMER',
      createdAt: past,
    },
  });
  await prisma.review.createMany({
    data: [
      { id: 'demo-review-1', taskId: 'demo-task-history', raterId: 'demo-user-priya', rateeId: 'demo-user-wei', stars: 5, comment: 'Spotless and super reliable. Would book again!', isPublished: true, createdAt: past },
      { id: 'demo-review-2', taskId: 'demo-task-history', raterId: 'demo-user-wei', rateeId: 'demo-user-priya', stars: 5, comment: 'Clear brief, easy handoff. Great to work with.', isPublished: true, createdAt: past },
    ],
  });

  const openCount = TASKS.length;
  console.log(`✅ Demo ready on ${CAMPUS_CODE}: ${USERS.length} students, ${openCount} open tasks, ${GIGS.length} services, 1 completed job with reviews.`);
  console.log('   Log in via the "Demo accounts" panel on /login (dev) and switch between:');
  for (const u of USERS) console.log(`   • ${u.fullName} — ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
