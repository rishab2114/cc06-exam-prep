import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton. In dev, Next hot-reloads modules — cache the client on
 * globalThis so we don't leak connections. Instantiation is lazy so `next build`
 * never needs DATABASE_URL.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function db(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
