import { PrismaClient, Role } from "@prisma/client";
import { createClient } from "redis";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD. Set both env vars before running seed-admin.",
    );
  }

  // Flush Redis so stale cached responses don't survive the DB reset
  const redisUrl = process.env.REDIS_URL;
  const redisConfig = redisUrl
    ? { url: redisUrl }
    : {
        socket: {
          host: process.env.REDIS_HOST ?? "localhost",
          port: parseInt(process.env.REDIS_PORT ?? "5101", 10),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      };

  const redis = createClient({
    ...redisConfig,
  });
  await redis.connect();
  await redis.flushAll();
  await redis.quit();
  console.log("✓ Redis cache flushed");
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
    },
  });

  console.log(`✓ Admin user ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
