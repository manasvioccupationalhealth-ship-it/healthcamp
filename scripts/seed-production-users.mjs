import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Provisioning production system users and role accounts...");

  const adminPassword = await bcrypt.hash("Admin@1234", 10);
  const defaultPassword = await bcrypt.hash("Password@123", 10);

  // 1. Create or find default Client Company
  let company = await prisma.company.findFirst({
    where: { codePrefix: "TAS" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Tata Advanced Systems Ltd.",
        codePrefix: "TAS",
        address: "Plot 42, Aerospace SEZ, Hardware Park",
        city: "Hyderabad",
        state: "Telangana",
        pinCode: "500005",
        registeredEmail: "occupational.health@tataadvanced.com",
        hrContactName: "Vikram Malhotra",
        hrMobile: "+91 98765 43210",
        amcStartDate: new Date("2026-01-01"),
        amcEndDate: new Date("2026-12-31"),
        isActive: true,
      },
    });
    console.log("Created default company:", company.name);
  }

  // 2. Create or find default Camp
  let camp = await prisma.camp.findFirst({
    where: { campId: "TAS-2026-CAMP01" },
  });

  if (!camp) {
    camp = await prisma.camp.create({
      data: {
        campId: "TAS-2026-CAMP01",
        name: "Annual Occupational Health Surveillance Camp 2026",
        companyId: company.id,
        location: "Factory Medical Centre, Hyderabad Plant",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-15"),
        operatingStatus: "ACTIVE",
      },
    });
    console.log("Created default active camp:", camp.name);

    // Create standard counters
    const counterDefs = [
      { counterNo: 1, name: "Registration & Token", code: "REG", counterType: "REGISTRATION", displayOrder: 1, allowsForm: true, allowsUpload: false },
      { counterNo: 2, name: "Vitals & Vision Screening", code: "VITALS", counterType: "VITALS_VISION", displayOrder: 2, allowsForm: true, allowsUpload: false },
      { counterNo: 3, name: "Phlebotomy & Lab Sample", code: "BLOOD", counterType: "BLOOD_COLLECTION", displayOrder: 3, allowsForm: true, allowsUpload: false },
      { counterNo: 4, name: "12-Lead ECG", code: "ECG", counterType: "ECG", displayOrder: 4, allowsForm: true, allowsUpload: true },
      { counterNo: 5, name: "Spirometry (PFT)", code: "PFT", counterType: "PFT", displayOrder: 5, allowsForm: true, allowsUpload: true },
      { counterNo: 6, name: "Pure Tone Audiometry", code: "AUDIO", counterType: "AUDIOMETRY", displayOrder: 6, allowsForm: true, allowsUpload: true },
      { counterNo: 7, name: "Digital Chest X-Ray", code: "XRAY", counterType: "CHEST_XRAY", displayOrder: 7, allowsForm: false, allowsUpload: true },
      { counterNo: 8, name: "Clinical Doctor Exam", code: "DOCTOR", counterType: "DOCTOR_EXAMINATION", displayOrder: 8, allowsForm: true, allowsUpload: false },
      { counterNo: 9, name: "Medical Record Back-Office", code: "BACKOFFICE", counterType: "BACK_OFFICE", displayOrder: 9, allowsForm: true, allowsUpload: true },
    ];

    for (const c of counterDefs) {
      await prisma.campCounter.create({
        data: {
          campId: camp.id,
          ...c,
        },
      });
    }
    console.log("Created standard camp counters (1-9)");
  }

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
