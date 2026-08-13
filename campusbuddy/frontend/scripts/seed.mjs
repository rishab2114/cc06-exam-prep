// Standalone, idempotent seed for Vercel build (JS mirror of backend/prisma/seed.ts).
// Seeds campuses + the service catalog the app needs to create/browse gigs.
// Safe to run on every deploy: all operations are upserts.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'room-cleaning', group: 'Hall services', name: 'Room cleaning', tier: 'T2', min: 1000, max: 3000 },
  { slug: 'deep-clean-inspection', group: 'Hall services', name: 'Deep clean (pre-inspection)', tier: 'T2', min: 2000, max: 6000 },
  { slug: 'room-organization', group: 'Hall services', name: 'Room organization', tier: 'T2', min: 1000, max: 3000 },
  { slug: 'bedsheet-change', group: 'Hall services', name: 'Bedsheet changing', tier: 'T2', min: 500, max: 1500 },
  { slug: 'laundry-pickup', group: 'Laundry', name: 'Laundry pickup', tier: 'T1', min: 500, max: 1500 },
  { slug: 'laundry-wash', group: 'Laundry', name: 'Laundry washing', tier: 'T1', min: 800, max: 2000 },
  { slug: 'laundry-dry', group: 'Laundry', name: 'Drying', tier: 'T1', min: 500, max: 1500 },
  { slug: 'laundry-iron', group: 'Laundry', name: 'Ironing', tier: 'T1', min: 800, max: 2500 },
  { slug: 'laundry-fold', group: 'Laundry', name: 'Folding', tier: 'T1', min: 500, max: 1500 },
  { slug: 'grocery-shopping', group: 'Food & grocery', name: 'Grocery shopping', tier: 'T1', min: 500, max: 2000 },
  { slug: 'food-pickup', group: 'Food & grocery', name: 'Food pickup', tier: 'T1', min: 300, max: 1000 },
  { slug: 'meal-collection', group: 'Food & grocery', name: 'Meal collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'late-night-run', group: 'Food & grocery', name: 'Late-night food run', tier: 'T2', min: 500, max: 1500 },
  { slug: 'parcel-collection', group: 'Convenience', name: 'Parcel collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'proxy-collection', group: 'Convenience', name: 'Proxy collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'queue-standing', group: 'Convenience', name: 'Queue standing', tier: 'T1', min: 500, max: 2000 },
  { slug: 'printing-docs', group: 'Convenience', name: 'Printing & document collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'study-help', group: 'Study help', name: 'Study help / tutoring', tier: 'T1', min: 1500, max: 4000 },
  { slug: 'spare-meal', group: 'Food & grocery', name: 'Spare home-cooked meal', tier: 'T1', min: 500, max: 1200 },
  { slug: 'hall-moving', group: 'Student help', name: 'Hall moving assistance', tier: 'T2', min: 1500, max: 5000 },
  { slug: 'luggage-carrying', group: 'Student help', name: 'Luggage carrying', tier: 'T2', min: 800, max: 2500 },
  { slug: 'airport-pickup', group: 'Student help', name: 'Airport pickup assistance', tier: 'T3', min: 3000, max: 8000, active: false },
  { slug: 'basic-cooking', group: 'Student help', name: 'Basic cooking', tier: 'T3', min: 1500, max: 4000, active: false },
];

const CAMPUSES = [
  { code: 'SUTD', name: 'Singapore University of Technology and Design', domains: ['mymail.sutd.edu.sg', 'sutd.edu.sg'] },
  { code: 'NTU', name: 'Nanyang Technological University', domains: ['e.ntu.edu.sg', 'ntu.edu.sg', 'staff.main.ntu.edu.sg'] },
  { code: 'NUS', name: 'National University of Singapore', domains: ['u.nus.edu', 'nus.edu.sg'] },
  { code: 'SMU', name: 'Singapore Management University', domains: ['smu.edu.sg'] },
  { code: 'SIT', name: 'Singapore Institute of Technology', domains: ['singaporetech.edu.sg'] },
  { code: 'SUSS', name: 'Singapore University of Social Sciences', domains: ['suss.edu.sg'] },
];

// --- Demo personas (mirrors backend/prisma/seed-demo.ts, in plain JS so the
// Vercel build can run it without ts-node). Only seeded on a DEMO deployment —
// one with no real email provider — so a real marketplace never gets fake users.
const DEMO_USERS = [
  { id: 'demo-user-priya', email: 'priya@e.ntu.edu.sg', fullName: 'Priya S', hall: 'Hall 9' },
  { id: 'demo-user-wei', email: 'wei@e.ntu.edu.sg', fullName: 'Wei Lim', hall: 'Crescent Hall' },
  { id: 'demo-user-arjun', email: 'arjun@e.ntu.edu.sg', fullName: 'Arjun Rao', hall: 'Binjai Hall' },
  {
    id: 'demo-user-amelia', email: 'amelia.swap@e.ntu.edu.sg', fullName: 'Amelia Tan', hall: 'Hall 10',
    hallSwap: { gender: 'FEMALE', term: 'Semester 1', haveHall: 'Hall 10', haveRoomType: 'DOUBLE', haveAircon: true, wantedHalls: ['Hall 8'], wantedRoomTypes: ['SINGLE'], wantedAircon: 'ANY' },
  },
  {
    id: 'demo-user-chloe', email: 'chloe.swap@e.ntu.edu.sg', fullName: 'Chloe Lim', hall: 'Hall 8',
    hallSwap: { gender: 'FEMALE', term: 'Semester 1', haveHall: 'Hall 8', haveRoomType: 'SINGLE', haveAircon: false, wantedHalls: ['Hall 10'], wantedRoomTypes: ['DOUBLE'], wantedAircon: 'AIRCON' },
  },
];

const DEMO_TASKS = [
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
];

// Sample service listings make the reverse marketplace demonstrable too. Each
// persona owns one gig, so whichever account a visitor chooses can still book
// two other students through the normal request -> accept -> chat flow.
const DEMO_GIGS = [
  { id: 'demo-gig-organise', by: 'demo-user-priya', slug: 'room-organization', budget: 1600, mins: 18,
    title: 'Hall-room reset: declutter + organise', hall: 'Any NTU hall', when: 'Weekend afternoons',
    description: 'A focused one-hour reset for desks, wardrobes and move-in clutter. You stay in the room while we sort.' },
  { id: 'demo-gig-laundry', by: 'demo-user-wei', slug: 'laundry-wash', budget: 1200, mins: 36,
    title: 'Same-day laundry wash, dry & fold', hall: 'Crescent Hall', when: 'Weekdays after 4pm',
    description: 'One standard bag, contactless pickup and return around Crescent and Pioneer halls.' },
  { id: 'demo-gig-calculus', by: 'demo-user-arjun', slug: 'study-help', budget: 2200, mins: 58,
    title: 'MH1810 calculus revision — 1:1 tutoring', hall: 'Lee Wee Nam Library', when: 'Weekday evenings',
    description: 'Concept explanations and past-paper practice for limits, differentiation and integration. Tutoring only.' },
];

async function seedDemo() {
  const campus = await prisma.campus.findUnique({ where: { code: 'NTU' } });
  if (!campus) return;

  const taskIds = [...DEMO_TASKS.map((t) => t.id), ...DEMO_GIGS.map((g) => g.id), 'demo-task-history'];
  const userIds = DEMO_USERS.map((u) => u.id);

  // Reset only demo-owned rows, so any real student's data is untouched.
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.message.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.review.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.dispute.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.safetyEvent.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.taskEvent.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.offer.deleteMany({ where: { taskId: { in: taskIds } } });
  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  await prisma.hallSwapConnection.deleteMany({
    where: { OR: [{ requesterId: { in: userIds } }, { recipientId: { in: userIds } }] },
  });

  // Upsert BY ID (not email): these personas moved campus/email when we
  // switched the launch campus to NTU, and the id is the stable key.
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { email: u.email, fullName: u.fullName, hall: u.hall, campusId: campus.id, emailVerifiedAt: new Date(), isSuspended: false },
      create: { id: u.id, email: u.email, fullName: u.fullName, hall: u.hall, campusId: campus.id, emailVerifiedAt: new Date() },
    });
    if (u.hallSwap) {
      await prisma.hallSwapProfile.upsert({
        where: { userId: u.id },
        update: { ...u.hallSwap, campusId: campus.id, isActive: true },
        create: { ...u.hallSwap, campusId: campus.id, userId: u.id },
      });
    }
  }

  const slugs = Array.from(new Set([...DEMO_TASKS.map((t) => t.slug), ...DEMO_GIGS.map((g) => g.slug)]));
  const cats = await prisma.serviceCategory.findMany({ where: { slug: { in: slugs } } });
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  for (const t of DEMO_TASKS) {
    const cat = catBySlug.get(t.slug);
    if (!cat) continue;
    const created = new Date(Date.now() - t.mins * 60_000);
    await prisma.task.create({
      data: {
        id: t.id, campusId: campus.id, customerId: t.by, categoryId: cat.id,
        title: t.title, description: t.description, hall: t.hall, whenText: t.when,
        budgetCents: t.budget, status: 'OPEN', study: t.study ?? undefined, createdAt: created,
        events: { create: { actorId: t.by, toStatus: 'OPEN', createdAt: created } },
      },
    });
  }

  for (const g of DEMO_GIGS) {
    const cat = catBySlug.get(g.slug);
    if (!cat) continue;
    const created = new Date(Date.now() - g.mins * 60_000);
    await prisma.task.create({
      data: {
        id: g.id, campusId: campus.id, customerId: g.by, categoryId: cat.id,
        kind: 'OFFER', title: g.title, description: g.description, hall: g.hall,
        whenText: g.when, budgetCents: g.budget, status: 'OPEN', createdAt: created,
        events: { create: { actorId: g.by, toStatus: 'OPEN', createdAt: created } },
      },
    });
  }

  // One finished job so provider reputation (⭐ + jobs done) is visible.
  const cleanCat = catBySlug.get('room-cleaning');
  if (cleanCat) {
    const past = new Date(Date.now() - 3 * 24 * 3600_000);
    await prisma.task.create({
      data: {
        id: 'demo-task-history', campusId: campus.id, customerId: 'demo-user-priya',
        providerId: 'demo-user-wei', categoryId: cleanCat.id,
        title: 'Room clean before I flew home for break',
        description: 'Full clean while I packed. Went great.',
        hall: 'Hall 9', whenText: 'Last Sunday', budgetCents: 2000, finalPriceCents: 2000,
        status: 'COMPLETED', createdAt: past, assignedAt: past, completedAt: past,
      },
    });
    await prisma.offer.create({
      data: { id: 'demo-offer-history', taskId: 'demo-task-history', providerId: 'demo-user-wei',
        amountCents: 2000, round: 1, state: 'ACCEPTED', lastActor: 'CUSTOMER', createdAt: past },
    });
    await prisma.review.createMany({
      data: [
        { id: 'demo-review-1', taskId: 'demo-task-history', raterId: 'demo-user-priya', rateeId: 'demo-user-wei', stars: 5, comment: 'Spotless and super reliable. Would book again!', isPublished: true, createdAt: past },
        { id: 'demo-review-2', taskId: 'demo-task-history', raterId: 'demo-user-wei', rateeId: 'demo-user-priya', stars: 5, comment: 'Clear brief, easy handoff. Great to work with.', isPublished: true, createdAt: past },
      ],
    });
  }
  console.log(`Seeded ${DEMO_USERS.length} demo students + ${DEMO_TASKS.length} open tasks + ${DEMO_GIGS.length} services + 2 hall-swap profiles (demo deployment).`);
}

async function main() {
  for (const c of CAMPUSES) {
    await prisma.campus.upsert({
      where: { code: c.code },
      update: { name: c.name, emailDomains: c.domains },
      create: { code: c.code, name: c.name, emailDomains: c.domains },
    });
  }
  console.log(`Seeded ${CAMPUSES.length} campuses.`);

  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.serviceCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        groupName: c.group,
        name: c.name,
        riskTier: c.tier,
        suggestedMinPrice: c.min,
        suggestedMaxPrice: c.max,
        isActive: c.active ?? true,
        sortOrder: i,
      },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} service categories.`);

  // Demo personas only on a demo deployment (no real email provider wired, or an
  // explicit SEED_DEMO=1). Wire RESEND_API_KEY and the fake accounts stop being
  // seeded — a real marketplace should never ship with fake students in it.
  if (process.env.SEED_DEMO === '1' || !process.env.RESEND_API_KEY) {
    await seedDemo();
  } else {
    console.log('Real email provider configured — skipping demo personas.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
