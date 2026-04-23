import { PrismaClient, Role } from "@prisma/client";
import { createClient } from "redis";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getRedisConfig():
  | { url: string }
  | {
      socket: { host: string; port: number };
      password: string | undefined;
    } {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl && /^rediss?:\/\//.test(redisUrl)) {
    return { url: redisUrl };
  }

  if (redisUrl) {
    console.warn(
      "Ignoring REDIS_URL because it is not a redis:// or rediss:// connection string.",
    );
  }

  return {
    socket: {
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "5101", 10),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD. Set both env vars before running seed-admin.",
    );
  }

  // Flush Redis so stale cached responses don't survive the DB reset
  const redisConfig = getRedisConfig();
  const redisSocketOptions = {
    connectTimeout: 5000,
    reconnectStrategy: () =>
      new Error("Redis reconnect disabled during admin seed"),
  };

  const redis = createClient(
    "url" in redisConfig
      ? {
          ...redisConfig,
          socket: redisSocketOptions,
        }
      : {
          ...redisConfig,
          socket: {
            ...redisConfig.socket,
            ...redisSocketOptions,
          },
        },
  );
  redis.on("error", (error) => {
    console.warn("Redis client error during admin seed:", error);
  });

  try {
    await redis.connect();
    await redis.flushAll();
    console.log("Redis cache flushed");
  } catch (error) {
    console.warn("Skipping Redis cache flush; continuing admin seed.", error);
  } finally {
    try {
      if (redis.isOpen) {
        await redis.quit();
      }
    } catch {
      if (redis.isOpen) {
        redis.disconnect();
      }
    }
  }

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

  console.log(`Admin user ready`);
  console.log(`└─ username: ${user.email}`);
  console.log(
    `└─ password: ${adminPassword.slice(0, 3)}${adminPassword.length > 6 ? adminPassword.slice(3).replace(/./g, "*") : ""}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
