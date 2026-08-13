import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Idempotent NTU profiles for demonstrating a real reciprocal match. These
// accounts use @e.ntu.edu.sg addresses and remain clearly synthetic fixtures.
const USERS = [
  {
    id: 'demo-ntu-swap-amelia',
    email: 'amelia.swap.demo@e.ntu.edu.sg',
    fullName: 'Amelia Demo',
    hall: 'Hall 10',
    profile: {
      gender: 'FEMALE',
      term: 'Semester 1',
      haveHall: 'Hall 10',
      haveRoomType: 'DOUBLE',
      haveAircon: true,
      wantedHalls: ['Hall 8'],
      wantedRoomTypes: ['SINGLE'],
      wantedAircon: 'ANY',
    },
  },
  {
    id: 'demo-ntu-swap-chloe',
    email: 'chloe.swap.demo@e.ntu.edu.sg',
    fullName: 'Chloe Demo',
    hall: 'Hall 8',
    profile: {
      gender: 'FEMALE',
      term: 'Semester 1',
      haveHall: 'Hall 8',
      haveRoomType: 'SINGLE',
      haveAircon: false,
      wantedHalls: ['Hall 10'],
      wantedRoomTypes: ['DOUBLE'],
      wantedAircon: 'AIRCON',
    },
  },
] as const;

async function main() {
  const campus = await prisma.campus.findUnique({ where: { code: 'NTU' } });
  if (!campus) throw new Error('NTU campus is missing — run the base seed first.');

  for (const fixture of USERS) {
    const user = await prisma.user.upsert({
      where: { email: fixture.email },
      update: {
        fullName: fixture.fullName,
        hall: fixture.hall,
        campusId: campus.id,
        emailVerifiedAt: new Date(),
        isSuspended: false,
      },
      create: {
        id: fixture.id,
        email: fixture.email,
        fullName: fixture.fullName,
        hall: fixture.hall,
        campusId: campus.id,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.hallSwapProfile.upsert({
      where: { userId: user.id },
      update: { ...fixture.profile, campusId: campus.id, isActive: true },
      create: { ...fixture.profile, campusId: campus.id, userId: user.id },
    });
  }

  console.log('✅ NTU Hall Swap demo: 2 verified students with one reciprocal match.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
