import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const relCamp = await prisma.camp.findFirst({
    where: { campId: "REL-2026-CAMP01" },
    include: { counters: true, company: true },
  });

  if (!relCamp) {
    console.log("No REL camp found");
    return;
  }

  // Get users
  const users = await prisma.user.findMany();
  const regUser = users.find((u) => u.role === "REGISTRATION_DESK") || users[0];
  const assistantUser = users.find((u) => u.role === "DOCTOR_ASSISTANT") || users[0];
  const counterUser = users.find((u) => u.role === "COUNTER_STAFF") || users[0];
  const doctorUser = users.find((u) => u.role === "DOCTOR") || users[0];
  const backofficeUser = users.find((u) => u.role === "BACK_OFFICE") || users[0];

  // Assign operators to Reliance counters
  for (const counter of relCamp.counters) {
    let assignedUser = counterUser;
    if (counter.code === "REG") assignedUser = regUser;
    else if (counter.code === "VITALS") assignedUser = assistantUser;
    else if (counter.code === "DOCTOR_EXAM") assignedUser = doctorUser;
    else if (counter.code === "BACK_OFFICE") assignedUser = backofficeUser;

    if (assignedUser) {
      await prisma.counterAssignment.deleteMany({
        where: { campId: relCamp.id, campCounterId: counter.id },
      });
      await prisma.counterAssignment.create({
        data: {
          campId: relCamp.id,
          campCounterId: counter.id,
          userId: assignedUser.id,
        },
      });
    }
  }

  // Clean existing reliance sample employees if partial
  await prisma.employee.deleteMany({ where: { campId: relCamp.id } });

  // Add 3 sample employees
  const emp1 = await prisma.employee.create({
    data: {
      campId: relCamp.id,
      companyId: relCamp.companyId,
      healthId: "REL-2026-0001",
      employeeCode: "REL-EMP-101",
      fullName: "Rahul Varma",
      sex: "MALE",
      dob: new Date("1988-06-14"),
      age: 38,
      mobile: "+91 98765 43220",
      department: "Power Generation",
      designation: "Plant Superintendent",
      employeeType: "COMPANY_STAFF",
      status: "FINALIZED",
      heightCm: 174,
      weightKg: 73.2,
      bmi: 24.2,
      bmiCategory: "Normal",
    },
  });

  await prisma.vitalsVision.create({
    data: {
      employeeId: emp1.id,
      systolicBp: 122,
      diastolicBp: 80,
      pulse: 74,
      distantVisionRight: "6/6",
      distantVisionLeft: "6/6",
      nearVisionRight: "N6",
      nearVisionLeft: "N6",
      colorVision: "Normal",
    },
  });

  await prisma.fitnessDecision.create({
    data: {
      employeeId: emp1.id,
      doctorId: doctorUser.id,
      fitnessStatus: "FIT",
      doctorRemarks: "All clinical and diagnostic parameters within normal range. Clinically fit for occupational duties.",
      adviceListJson: JSON.stringify(["Annual Health Checkup", "Balanced Diet", "Hydration"]),
      signedAt: new Date(),
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      campId: relCamp.id,
      companyId: relCamp.companyId,
      healthId: "REL-2026-0002",
      employeeCode: "REL-EMP-102",
      fullName: "Kavita Reddy",
      sex: "FEMALE",
      dob: new Date("1993-09-22"),
      age: 33,
      mobile: "+91 98765 43221",
      department: "Instrumentation & Control",
      designation: "Senior Automation Engineer",
      employeeType: "COMPANY_STAFF",
      status: "PENDING_DOCTOR",
      heightCm: 162,
      weightKg: 59.8,
      bmi: 22.8,
      bmiCategory: "Normal",
    },
  });

  await prisma.vitalsVision.create({
    data: {
      employeeId: emp2.id,
      systolicBp: 118,
      diastolicBp: 78,
      pulse: 72,
      distantVisionRight: "6/9",
      distantVisionLeft: "6/9",
      nearVisionRight: "N6",
      nearVisionLeft: "N6",
      colorVision: "Normal",
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      campId: relCamp.id,
      companyId: relCamp.companyId,
      healthId: "REL-2026-0003",
      employeeCode: "REL-CNT-501",
      fullName: "Dinesh Patel",
      sex: "MALE",
      dob: new Date("1985-03-10"),
      age: 41,
      mobile: "+91 98765 43222",
      department: "Turbine Maintenance",
      designation: "Turbine Tech Specialist",
      employeeType: "CONTRACT_EMPLOYEE",
      contractorName: "L&T Heavy Engineering",
      status: "IN_PROGRESS",
      heightCm: 170,
      weightKg: 79.2,
      bmi: 27.4,
      bmiCategory: "Overweight",
    },
  });

  await prisma.vitalsVision.create({
    data: {
      employeeId: emp3.id,
      systolicBp: 138,
      diastolicBp: 88,
      pulse: 82,
      distantVisionRight: "6/6",
      distantVisionLeft: "6/6",
      nearVisionRight: "N6",
      nearVisionLeft: "N6",
      colorVision: "Normal",
    },
  });

  // Create visits
  for (const counter of relCamp.counters) {
    await prisma.counterVisit.create({
      data: {
        campId: relCamp.id,
        employeeId: emp1.id,
        campCounterId: counter.id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    await prisma.counterVisit.create({
      data: {
        campId: relCamp.id,
        employeeId: emp2.id,
        campCounterId: counter.id,
        status: counter.counterNo <= 6 ? "COMPLETED" : "WAITING",
        completedAt: counter.counterNo <= 6 ? new Date() : null,
      },
    });
    await prisma.counterVisit.create({
      data: {
        campId: relCamp.id,
        employeeId: emp3.id,
        campCounterId: counter.id,
        status: counter.counterNo <= 2 ? "COMPLETED" : counter.counterNo === 3 ? "IN_PROGRESS" : "WAITING",
        completedAt: counter.counterNo <= 2 ? new Date() : null,
      },
    });
  }

  console.log("Successfully seeded Reliance camp with 3 employees and full counter visits!");
}

run().finally(() => prisma.$disconnect());
