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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
