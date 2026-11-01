import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || "admin@manasvihealth.com").toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || "ManasviAdmin@2026";
  const name = args[2] || process.env.ADMIN_NAME || "Super Administrator";

  console.log(`[Production Setup] Creating Super Admin account for: ${email}`);

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
    console.log(`[Production Setup] Super Admin user updated successfully (ID: ${updated.id})`);
  } else {
    const created = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
    console.log(`[Production Setup] Super Admin user created successfully (ID: ${created.id})`);
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      entityType: "USER",
      entityId: email,
      action: "PRODUCTION_ADMIN_PROVISIONED",
      afterJson: JSON.stringify({ email, timestamp: new Date().toISOString() }),
    },
  });

  console.log("[Production Setup] Complete! Log in at /login with your admin credentials.");
}

main()
  .catch((e) => {
    console.error("[Production Setup Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
