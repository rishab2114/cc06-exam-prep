import { PrismaClient, RiskTier } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the service catalog (docs/01 §8). Risk tiers gate verification/safety
 * requirements; T3 categories are seeded but inactive until Phase 2 (docs/16).
 */
type Cat = {
  slug: string;
  group: string;
  name: string;
  tier: RiskTier;
  min: number; // cents
  max: number;
  active?: boolean;
};

const CATEGORIES: Cat[] = [
  // Hall services (room entry -> T2)
  { slug: 'room-cleaning', group: 'Hall services', name: 'Room cleaning', tier: 'T2', min: 1000, max: 3000 },
  { slug: 'deep-clean-inspection', group: 'Hall services', name: 'Deep clean (pre-inspection)', tier: 'T2', min: 2000, max: 6000 },
  { slug: 'room-organization', group: 'Hall services', name: 'Room organization', tier: 'T2', min: 1000, max: 3000 },
  { slug: 'bedsheet-change', group: 'Hall services', name: 'Bedsheet changing', tier: 'T2', min: 500, max: 1500 },

  // Laundry (T1)
  { slug: 'laundry-pickup', group: 'Laundry', name: 'Laundry pickup', tier: 'T1', min: 500, max: 1500 },
  { slug: 'laundry-wash', group: 'Laundry', name: 'Laundry washing', tier: 'T1', min: 800, max: 2000 },
  { slug: 'laundry-dry', group: 'Laundry', name: 'Drying', tier: 'T1', min: 500, max: 1500 },
  { slug: 'laundry-iron', group: 'Laundry', name: 'Ironing', tier: 'T1', min: 800, max: 2500 },
  { slug: 'laundry-fold', group: 'Laundry', name: 'Folding', tier: 'T1', min: 500, max: 1500 },

  // Food & grocery (T1; late-night -> T2)
  { slug: 'grocery-shopping', group: 'Food & grocery', name: 'Grocery shopping', tier: 'T1', min: 500, max: 2000 },
  { slug: 'food-pickup', group: 'Food & grocery', name: 'Food pickup', tier: 'T1', min: 300, max: 1000 },
  { slug: 'meal-collection', group: 'Food & grocery', name: 'Meal collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'late-night-run', group: 'Food & grocery', name: 'Late-night food run', tier: 'T2', min: 500, max: 1500 },

  // Convenience (T1)
  { slug: 'parcel-collection', group: 'Convenience', name: 'Parcel collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'proxy-collection', group: 'Convenience', name: 'Proxy collection', tier: 'T1', min: 300, max: 1000 },
  { slug: 'queue-standing', group: 'Convenience', name: 'Queue standing', tier: 'T1', min: 500, max: 2000 },
  { slug: 'printing-docs', group: 'Convenience', name: 'Printing & document collection', tier: 'T1', min: 300, max: 1000 },

  // Student help
  { slug: 'hall-moving', group: 'Student help', name: 'Hall moving assistance', tier: 'T2', min: 1500, max: 5000 },
  { slug: 'luggage-carrying', group: 'Student help', name: 'Luggage carrying', tier: 'T2', min: 800, max: 2500 },
  // T3 — deferred to Phase 2 (off-campus / vehicles / food safety). Seeded inactive.
  { slug: 'airport-pickup', group: 'Student help', name: 'Airport pickup assistance', tier: 'T3', min: 3000, max: 8000, active: false },
  { slug: 'basic-cooking', group: 'Student help', name: 'Basic cooking', tier: 'T3', min: 1500, max: 4000, active: false },
];

async function main() {
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
  // eslint-disable-next-line no-console
  console.log(`Seeded ${CATEGORIES.length} service categories.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
