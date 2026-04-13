import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const prismaLogLevels: ("query" | "error" | "warn")[] = isProduction
  ? ["error", "warn"]
  : isTest
    ? ["error", "warn"]
    : ["error", "warn", "query"];

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogLevels,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
