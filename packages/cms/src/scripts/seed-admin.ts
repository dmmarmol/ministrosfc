import { PrismaClient, Role } from "@prisma/client";
import { createClient } from "redis";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Flush Redis so stale cached responses don't survive the DB reset
  const redis = createClient({
    socket: {
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "5101", 10),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
  await redis.connect();
  await redis.flushAll();
  await redis.quit();
  console.log("✓ Redis cache flushed");
  const passwordHash = await bcrypt.hash("Admin1234!", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@ministrosfc.com" },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: "admin@ministrosfc.com",
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
