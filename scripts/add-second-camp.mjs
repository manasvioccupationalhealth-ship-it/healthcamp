import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const rel = await prisma.company.findFirst({ where: { codePrefix: "REL" } });
  if (rel) {
    const existing = await prisma.camp.findFirst({ where: { companyId: rel.id } });
    if (!existing) {
      const camp = await prisma.camp.create({
        data: {
          campId: "REL-2026-CAMP01",
          name: "Reliance Infra Annual Occupational Camp 2026",
          companyId: rel.id,
          location: "Reliance Knowledge City, OHC Ground Floor",
          startDate: new Date("2026-11-10"),
          endDate: new Date("2026-11-15"),
          operatingStatus: "ACTIVE",
        },
      });

      const defaultCounters = [
        { no: 1, name: "Registration Desk", code: "REG", type: "REGISTRATION", order: 1 },
        { no: 2, name: "Doctor Assistant (BP & Vision)", code: "VITALS", type: "VITALS_VISION", order: 2 },
        { no: 3, name: "Blood Collection & Lab", code: "BLOOD", type: "BLOOD_COLLECTION", order: 3 },
        { no: 4, name: "Resting 12-Lead ECG", code: "ECG", type: "ECG", order: 4 },
        { no: 5, name: "Pulmonary Function Test (PFT)", code: "PFT", type: "PFT", order: 5 },
        { no: 6, name: "Audiometry Hearing Test", code: "AUDIO", type: "AUDIOMETRY", order: 6 },
        { no: 7, name: "Digital Chest X-Ray", code: "XRAY", type: "CHEST_XRAY", order: 7 },
        { no: 8, name: "Doctor Clinical Examination", code: "DOCTOR_EXAM", type: "DOCTOR_EXAMINATION", order: 8 },
        { no: 9, name: "Back Office Verification", code: "BACK_OFFICE", type: "BACK_OFFICE", order: 9 },
      ];

      for (const c of defaultCounters) {
        await prisma.campCounter.create({
          data: {
            campId: camp.id,
            counterNo: c.no,
            name: c.name,
            code: c.code,
            counterType: c.type,
            displayOrder: c.order,
            isMandatory: true,
          },
        });
      }
      console.log("Created Reliance second camp successfully!");
    }
  }
}

run().finally(() => prisma.$disconnect());
