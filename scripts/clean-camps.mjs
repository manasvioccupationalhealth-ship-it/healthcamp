import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning all dummy camps, companies, and operational data from Supabase...");

  // 1. Unlink company from any users
  await prisma.user.updateMany({
    data: { companyId: null }
  });

  // 2. Delete all operational data
  await prisma.auditLog.deleteMany();
  await prisma.notificationQueue.deleteMany();
  await prisma.emailQueue.deleteMany();
  await prisma.syncOperation.deleteMany();
  await prisma.medicalReport.deleteMany();
  await prisma.fitnessDecision.deleteMany();
  await prisma.doctorExamination.deleteMany();
  await prisma.bloodResult.deleteMany();
  await prisma.diagnosticResult.deleteMany();
  await prisma.medicalAttachment.deleteMany();
  await prisma.vitalsVision.deleteMany();
  await prisma.counterVisit.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.counterAssignment.deleteMany();
  await prisma.campCounter.deleteMany();
  await prisma.camp.deleteMany();
  await prisma.company.deleteMany();

  const campCount = await prisma.camp.count();
  const companyCount = await prisma.company.count();
  const employeeCount = await prisma.employee.count();
  const userCount = await prisma.user.count();

  console.log(`Database is completely pristine and clean of dummy data!`);
  console.log(`Camps: ${campCount}`);
  console.log(`Companies: ${companyCount}`);
  console.log(`Employees/Patients: ${employeeCount}`);
  console.log(`System Users (Logins): ${userCount}`);
}

main()
  .catch((e) => {
    console.error("Error during clean:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
