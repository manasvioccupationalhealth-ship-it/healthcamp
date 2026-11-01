import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  for (const comp of companies) {
    const existing = await prisma.user.findUnique({
      where: { email: comp.registeredEmail.toLowerCase() },
    });
    if (!existing) {
      const hash = await bcrypt.hash("Password@123", 10);
      await prisma.user.create({
        data: {
          email: comp.registeredEmail.toLowerCase(),
          name: comp.hrContactName || `${comp.name} HR`,
          passwordHash: hash,
          role: "COMPANY_HR",
          companyId: comp.id,
          mobile: comp.hrMobile,
        },
      });
      console.log("Created HR user for company:", comp.name, comp.registeredEmail);
    } else {
      console.log("HR user already exists for:", comp.name, comp.registeredEmail);
    }
  }
}

main().finally(() => prisma.$disconnect());
