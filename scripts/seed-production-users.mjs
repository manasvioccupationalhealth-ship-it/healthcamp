import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Provisioning production system users and role accounts...");

  const adminPassword = await bcrypt.hash("Admin@1234", 10);
  const defaultPassword = await bcrypt.hash("Password@123", 10);

  // 3. User specifications for all roles
  const usersToSeed = [
    {
      email: "admin@healthcamp.local",
      name: "System Super Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      mobile: "+91 90000 00001",
    },
    {
      email: "doctor@healthcamp.local",
      name: "Dr. Rajesh Sharma, MD (Occ. Health)",
      passwordHash: defaultPassword,
      role: "DOCTOR",
      mobile: "+91 98999 88776",
    },
    {
      email: "assistant@healthcamp.local",
      name: "Nurse Kavita Sharma",
      passwordHash: defaultPassword,
      role: "DOCTOR_ASSISTANT",
      mobile: "+91 98000 00003",
    },
    {
      email: "registration@healthcamp.local",
      name: "Anjali Verma (Desk Operator)",
      passwordHash: defaultPassword,
      role: "REGISTRATION_DESK",
      mobile: "+91 98000 00002",
    },
    {
      email: "hr@tataadvanced.local",
      name: "Vikram Malhotra (HR Head)",
      passwordHash: defaultPassword,
      role: "COMPANY_HR",
      companyId: company.id,
      mobile: "+91 98765 43210",
    },
    {
      email: "backoffice@healthcamp.local",
      name: "Priya Nair (Back Office Lead)",
      passwordHash: defaultPassword,
      role: "BACK_OFFICE",
      mobile: "+91 98000 00009",
    },
    {
      email: "lab@healthcamp.local",
      name: "Ramesh Nair (Lab Tech)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00004",
    },
    {
      email: "ecg@healthcamp.local",
      name: "Deepak Joshi (ECG Tech)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00005",
    },
    {
      email: "pft@healthcamp.local",
      name: "Pooja Hegde (PFT Tech)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00006",
    },
    {
      email: "audio@healthcamp.local",
      name: "Siddharth Rao (Audiometry)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00007",
    },
    {
      email: "xray@healthcamp.local",
      name: "Manoj Kumar (Radiographer)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00008",
    },
  ];

  for (const u of usersToSeed) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          isActive: true,
          companyId: u.companyId || null,
        },
      });
      console.log(`Updated user: ${u.email} (${u.role})`);
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          mobile: u.mobile,
          isActive: true,
          companyId: u.companyId || null,
          termsAcceptedAt: new Date(),
          termsAcceptedIp: "127.0.0.1",
          termsVersion: "v1.0-dpdp2023",
        },
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    }
  }

  console.log("\nAll role accounts provisioned successfully in Supabase PostgreSQL!");
}

main()
  .catch((e) => {
    console.error("Error provisioning users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
