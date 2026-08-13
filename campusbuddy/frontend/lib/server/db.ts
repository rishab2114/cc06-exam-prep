import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton. In dev, Next hot-reloads modules — cache the client on
 * globalThis so we don't leak connections. Instantiation is lazy so `next build`
 * never needs DATABASE_URL.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function db(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // On Vercel the Prisma Postgres integration provides POSTGRES_URL (a direct
    // postgresql:// connection). Prefer it so a plain PrismaClient connects
    // without the Accelerate extension. Locally, fall back to DATABASE_URL.
    const url = process.env.POSTGRES_URL;
    globalForPrisma.prisma = url
      ? new PrismaClient({ datasources: { db: { url } } })
      : new PrismaClient();
  }
  return globalForPrisma.prisma;
}
