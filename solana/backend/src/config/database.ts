import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export function createPrismaClient(): PrismaClient {
  if (prisma) return prisma;

  prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
    logger.debug('DB Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });

  prisma.$on('error' as never, (e: Prisma.LogEvent) => {
    logger.error('DB Error', {
      message: e.message,
      target: e.target,
    });
  });

  return prisma;
}
