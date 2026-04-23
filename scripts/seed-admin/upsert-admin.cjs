const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

(async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars");
  }

  const prisma = new PrismaClient();
  try {
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

    console.log(`Admin user ready: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
