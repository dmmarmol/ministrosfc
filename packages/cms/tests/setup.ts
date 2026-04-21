import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { disconnectRedis } from "../src/config/redis";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://dev:dev123@localhost:5100/ministrosfc_test";

process.env.DATABASE_URL = TEST_DB_URL;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-secret-key-at-least-64-chars-long-for-test-suite-only-do-not-use";
// Do not override REDIS_HOST/REDIS_PORT here — env-setup.js already sets them
// respecting CI env vars (6379) with fallback to local dev (5101).

const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.gameParticipant.deleteMany(),
    prisma.statistics.deleteMany(),
    prisma.game.deleteMany(),
    prisma.playground.deleteMany(),
    prisma.player.deleteMany(),
    prisma.opponentTeam.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

beforeAll(async () => {
  // Run migrations on test database
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
  });
  // Clean before each test suite starts
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectRedis();
  await prisma.$disconnect();
});

export { prisma };
