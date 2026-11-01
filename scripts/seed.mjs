import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with occupational health surveillance data...");

  // 1. Password hash for all demo users
  const defaultPassword = await bcrypt.hash("Password@123", 10);
  const adminPassword = await bcrypt.hash("Admin@1234", 10);

  // 2. Clean existing records
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
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 3. Create Companies
  const tataCompany = await prisma.company.create({
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

  const relianceCompany = await prisma.company.create({
    data: {
      name: "Reliance Infrastructure Ltd.",
      codePrefix: "REL",
      address: "Dhirubhai Ambani Knowledge City, Kopar Khairane",
      city: "Navi Mumbai",
      state: "Maharashtra",
      pinCode: "400710",
      registeredEmail: "health.safety@relianceinfra.com",
      hrContactName: "Sneha Patil",
      hrMobile: "+91 98111 22334",
      amcStartDate: new Date("2026-02-01"),
      amcEndDate: new Date("2027-01-31"),
      isActive: true,
    },
  });

  // 4. Create Users for all roles
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@healthcamp.local",
      name: "System Super Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      mobile: "+91 90000 00001",
    },
  });

  const companyHr = await prisma.user.create({
    data: {
      email: "hr@tataadvanced.local",
      name: "Vikram Malhotra (HR Head)",
      passwordHash: defaultPassword,
      role: "COMPANY_HR",
      companyId: tataCompany.id,
      mobile: "+91 98765 43210",
    },
  });

  const regStaff = await prisma.user.create({
    data: {
      email: "registration@healthcamp.local",
      name: "Anjali Verma (Desk Operator)",
      passwordHash: defaultPassword,
      role: "REGISTRATION_DESK",
      mobile: "+91 98000 00002",
    },
  });

  const vitalsAssistant = await prisma.user.create({
    data: {
      email: "assistant@healthcamp.local",
      name: "Nurse Kavita Sharma",
      passwordHash: defaultPassword,
      role: "DOCTOR_ASSISTANT",
      mobile: "+91 98000 00003",
    },
  });

  const labTech = await prisma.user.create({
    data: {
      email: "lab@healthcamp.local",
      name: "Ramesh Nair (Lab Tech)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00004",
    },
  });

  const ecgTech = await prisma.user.create({
    data: {
      email: "ecg@healthcamp.local",
      name: "Deepak Joshi (ECG Tech)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00005",
    },
  });

  const pftTech = await prisma.user.create({
    data: {
      email: "pft@healthcamp.local",
      name: "Pooja Hegde (PFT Tech)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00006",
    },
  });

  const audioTech = await prisma.user.create({
    data: {
      email: "audio@healthcamp.local",
      name: "Siddharth Rao (Audiometry)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00007",
    },
  });

  const xrayTech = await prisma.user.create({
    data: {
      email: "xray@healthcamp.local",
      name: "Manoj Kumar (Radiographer)",
      passwordHash: defaultPassword,
      role: "COUNTER_STAFF",
      mobile: "+91 98000 00008",
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: "doctor@healthcamp.local",
      name: "Dr. Rajesh Sharma, MD (Occ. Health)",
      passwordHash: defaultPassword,
      role: "DOCTOR",
      mobile: "+91 98999 88776",
    },
  });

  const backOffice = await prisma.user.create({
    data: {
      email: "backoffice@healthcamp.local",
      name: "Priya Nair (Back Office Lead)",
      passwordHash: defaultPassword,
      role: "BACK_OFFICE",
      mobile: "+91 98000 00009",
    },
  });

  // 5. Create Camp
  const camp = await prisma.camp.create({
    data: {
      campId: "TAS-2026-CAMP01",
      name: "TAS Annual Occupational Health Surveillance Camp 2026",
      companyId: tataCompany.id,
      location: "TAS Hangar 3, Main Occupational Health Center",
      startDate: new Date("2026-10-25"),
      endDate: new Date("2026-10-30"),
      operatingStatus: "ACTIVE",
      configJson: JSON.stringify({
        allowParallelCounters: true,
        companyPrefix: "TAS-2026",
        enableSmsNotification: true,
        enableWhatsappNotification: true,
      }),
    },
  });

  // 6. Configured Camp Counters in defined sequence
  const countersConfig = [
    { no: 1, name: "Registration Desk", code: "REG", type: "REGISTRATION", order: 1, upload: false, form: true, user: regStaff },
    { no: 2, name: "Doctor Assistant (BP & Vision)", code: "VITALS", type: "VITALS_VISION", order: 2, upload: false, form: true, user: vitalsAssistant },
    { no: 3, name: "Blood Collection & Lab", code: "BLOOD", type: "BLOOD_COLLECTION", order: 3, upload: true, form: true, user: labTech },
    { no: 4, name: "Resting 12-Lead ECG", code: "ECG", type: "ECG", order: 4, upload: true, form: true, user: ecgTech },
    { no: 5, name: "Pulmonary Function Test (PFT)", code: "PFT", type: "PFT", order: 5, upload: true, form: true, user: pftTech },
    { no: 6, name: "Pure Tone Audiometry", code: "AUDIO", type: "AUDIOMETRY", order: 6, upload: true, form: true, user: audioTech },
    { no: 7, name: "Digital Chest X-Ray", code: "XRAY", type: "CHEST_XRAY", order: 7, upload: true, form: false, user: xrayTech },
    { no: 8, name: "Doctor Clinical Examination", code: "DOCTOR_EXAM", type: "DOCTOR_EXAMINATION", order: 8, upload: false, form: true, user: doctor },
    { no: 9, name: "Back Office Verification & Review", code: "BACK_OFFICE", type: "BACK_OFFICE", order: 9, upload: true, form: true, user: backOffice },
  ];

  const createdCounters = [];
  for (const c of countersConfig) {
    const counter = await prisma.campCounter.create({
      data: {
        campId: camp.id,
        counterNo: c.no,
        name: c.name,
        code: c.code,
        counterType: c.type,
        displayOrder: c.order,
        isMandatory: true,
        allowsUpload: c.upload,
        allowsForm: c.form,
      },
    });
    createdCounters.push(counter);

    await prisma.counterAssignment.create({
      data: {
        campId: camp.id,
        campCounterId: counter.id,
        userId: c.user.id,
      },
    });
  }

  // 7. Seed Sample Employees across different stages
  const sampleEmployees = [
    {
      healthId: "TAS-2026-0001",
      employeeCode: "TAS-E101",
      fullName: "Arun Kumar",
      type: "COMPANY_STAFF",
      contractor: null,
      dob: new Date("1988-04-12"),
      age: 38,
      sex: "MALE",
      department: "Avionics Assembly",
      designation: "Senior Avionics Engineer",
      tenureYears: 6,
      tenureMonths: 4,
      mobile: "+91 98760 11111",
      heightCm: 174,
      weightKg: 72,
      bmi: 23.8,
      bmiCategory: "Normal",
      status: "FINALIZED",
      bpSystolic: 120,
      bpDiastolic: 80,
      fitness: "FIT",
      advice: ["Annual Health Checkup", "Balanced Diet"],
    },
    {
      healthId: "TAS-2026-0002",
      employeeCode: "TAS-E102",
      fullName: "Pooja Sundaram",
      type: "COMPANY_STAFF",
      contractor: null,
      dob: new Date("1994-09-21"),
      age: 32,
      sex: "FEMALE",
      department: "Quality Assurance",
      designation: "Quality Inspector",
      tenureYears: 3,
      tenureMonths: 8,
      mobile: "+91 98760 22222",
      heightCm: 162,
      weightKg: 68,
      bmi: 25.9,
      bmiCategory: "Overweight",
      status: "FINALIZED",
      bpSystolic: 128,
      bpDiastolic: 84,
      fitness: "FIT_WITH_RESTRICTION",
      advice: ["Needs Spectacles", "Ergonomic Exercises"],
      restriction: "Avoid continuous display screen work exceeding 4 hours without break",
    },
    {
      healthId: "TAS-2026-0003",
      employeeCode: "CNT-4041",
      fullName: "Mohammad Farooq",
      type: "CONTRACT_EMPLOYEE",
      contractorName: "Falcon Security & Logistics",
      dob: new Date("1982-01-15"),
      age: 44,
      sex: "MALE",
      department: "Security & Perimeter",
      designation: "Security Officer",
      tenureYears: 4,
      tenureMonths: 0,
      mobile: "+91 98760 33333",
      heightCm: 178,
      weightKg: 89,
      bmi: 28.1,
      bmiCategory: "Overweight",
      status: "PENDING_DOCTOR",
      bpSystolic: 142,
      bpDiastolic: 92,
    },
    {
      healthId: "TAS-2026-0004",
      employeeCode: "TAS-E104",
      fullName: "Deepa Narayanan",
      type: "COMPANY_STAFF",
      contractor: null,
      dob: new Date("1990-11-05"),
      age: 35,
      sex: "FEMALE",
      department: "Precision Machining",
      designation: "CNC Programmer",
      tenureYears: 5,
      tenureMonths: 2,
      mobile: "+91 98760 44444",
      heightCm: 158,
      weightKg: 52,
      bmi: 20.8,
      bmiCategory: "Normal",
      status: "PENDING_VERIFICATION",
      bpSystolic: 118,
      bpDiastolic: 76,
    },
    {
      healthId: "TAS-2026-0005",
      employeeCode: "CNT-5012",
      fullName: "Suresh Baburao",
      type: "CONTRACT_EMPLOYEE",
      contractorName: "Apex Facility Care",
      dob: new Date("1996-07-30"),
      age: 30,
      sex: "MALE",
      department: "Facility Maintenance",
      designation: "Maintenance Electrician",
      tenureYears: 2,
      tenureMonths: 6,
      mobile: "+91 98760 55555",
      heightCm: 168,
      weightKg: 61,
      bmi: 21.6,
      bmiCategory: "Normal",
      status: "IN_PROGRESS",
      bpSystolic: 122,
      bpDiastolic: 78,
    },
    {
      healthId: "TAS-2026-0006",
      employeeCode: "TAS-E106",
      fullName: "Sanjay Singhania",
      type: "COMPANY_STAFF",
      contractor: null,
      dob: new Date("1976-03-18"),
      age: 50,
      sex: "MALE",
      department: "Hydraulics & Flight Controls",
      designation: "Lead Systems Specialist",
      tenureYears: 12,
      tenureMonths: 1,
      mobile: "+91 98760 66666",
      heightCm: 172,
      weightKg: 93,
      bmi: 31.4,
      bmiCategory: "Obese",
      status: "REGISTERED",
      bpSystolic: null,
      bpDiastolic: null,
    },
  ];

  for (const empData of sampleEmployees) {
    const emp = await prisma.employee.create({
      data: {
        campId: camp.id,
        companyId: tataCompany.id,
        healthId: empData.healthId,
        employeeType: empData.type,
        contractorName: empData.contractorName,
        employeeCode: empData.employeeCode,
        fullName: empData.fullName,
        dob: empData.dob,
        age: empData.age,
        sex: empData.sex,
        department: empData.department,
        designation: empData.designation,
        tenureYears: empData.tenureYears,
        tenureMonths: empData.tenureMonths,
        mobile: empData.mobile,
        heightCm: empData.heightCm,
        weightKg: empData.weightKg,
        bmi: empData.bmi,
        bmiCategory: empData.bmiCategory,
        status: empData.status,
      },
    });

    // Create Counter Visits
    for (const counter of createdCounters) {
      let visitStatus = "WAITING";
      let completedAt = null;

      if (empData.status === "FINALIZED") {
        visitStatus = "COMPLETED";
        completedAt = new Date();
      } else if (empData.status === "PENDING_DOCTOR") {
        visitStatus = counter.counterNo <= 7 ? "COMPLETED" : "WAITING";
        completedAt = counter.counterNo <= 7 ? new Date() : null;
      } else if (empData.status === "PENDING_VERIFICATION") {
        visitStatus = counter.counterNo <= 6 ? "COMPLETED" : "WAITING";
        completedAt = counter.counterNo <= 6 ? new Date() : null;
      } else if (empData.status === "IN_PROGRESS") {
        visitStatus = counter.counterNo <= 3 ? "COMPLETED" : counter.counterNo === 4 ? "IN_PROGRESS" : "WAITING";
        completedAt = counter.counterNo <= 3 ? new Date() : null;
      }

      await prisma.counterVisit.create({
        data: {
          campId: camp.id,
          campCounterId: counter.id,
          employeeId: emp.id,
          status: visitStatus,
          completedAt,
        },
      });
    }

    // If Vitals recorded
    if (empData.bpSystolic) {
      await prisma.vitalsVision.create({
        data: {
          employeeId: emp.id,
          systolicBp: empData.bpSystolic,
          diastolicBp: empData.bpDiastolic,
          pulse: 74,
          distantVisionRight: "6/6",
          distantVisionLeft: "6/6",
          nearVisionRight: "N6",
          nearVisionLeft: "N6",
          withGlasses: false,
          colorVision: "Normal",
          recordedBy: vitalsAssistant.name,
        },
      });
    }

    // If Blood parameters recorded
    if (["FINALIZED", "PENDING_DOCTOR", "PENDING_VERIFICATION"].includes(empData.status)) {
      await prisma.bloodResult.create({
        data: {
          employeeId: emp.id,
          isVerified: true,
          verifiedBy: labTech.name,
          parametersJson: JSON.stringify({
            haemoglobin: { value: 14.8, unit: "g/dL", range: "13.0 - 17.0", status: "NORMAL" },
            wbc: { value: 6800, unit: "/cumm", range: "4000 - 11000", status: "NORMAL" },
            bloodSugarRandom: { value: 98, unit: "mg/dL", range: "70 - 140", status: "NORMAL" },
            serumCreatinine: { value: 0.9, unit: "mg/dL", range: "0.7 - 1.3", status: "NORMAL" },
            totalCholesterol: { value: 185, unit: "mg/dL", range: "< 200", status: "NORMAL" },
          }),
        },
      });

      // Diagnostic results (ECG, PFT, Audio, XRay)
      await prisma.diagnosticResult.createMany({
        data: [
          {
            employeeId: emp.id,
            testType: "ECG",
            findings: "Normal sinus rhythm, Rate 72/min, Normal axis, No ST-T changes",
            conclusion: "Normal",
            verifiedBy: ecgTech.name,
          },
          {
            employeeId: emp.id,
            testType: "PFT",
            numericalData: JSON.stringify({ fvc: 4.12, fev1: 3.45, ratio: 83.7 }),
            findings: "Spirometry within normal physiological limits (FVC 98% predicted)",
            conclusion: "Normal",
            verifiedBy: pftTech.name,
          },
          {
            employeeId: emp.id,
            testType: "AUDIOMETRY",
            numericalData: JSON.stringify({ rightEarThresholdDb: 15, leftEarThresholdDb: 20 }),
            findings: "Bilateral normal hearing sensitivity. No acoustic notch detected.",
            conclusion: "Normal",
            verifiedBy: audioTech.name,
          },
          {
            employeeId: emp.id,
            testType: "CHEST_XRAY",
            findings: "Lung fields clear, Bronchovascular markings normal, Cardiac silhouette normal",
            conclusion: "Normal",
            verifiedBy: xrayTech.name,
          },
        ],
      });
    }

    // If Doctor examined
    if (["FINALIZED", "PENDING_DOCTOR"].includes(empData.status)) {
      await prisma.doctorExamination.create({
        data: {
          employeeId: emp.id,
          doctorId: doctor.id,
          pastMedicalHistory: "No prior history of diabetes, hypertension or major surgery",
          occupationalHistory: "Working in aerospace assembly for 6 years. Wears PPE regularly.",
          presentComplaints: "No current complaints",
          nadFlagsJson: JSON.stringify({
            physical: "NAD",
            respiratory: "NAD",
            cardiovascular: "NAD",
            gastrointestinal: "NAD",
            centralNervous: "NAD",
            musculoskeletal: "NAD",
          }),
          isDraft: false,
          generalAdvice: "Maintain regular physical activity and continue ear protection at work.",
        },
      });
    }

    // If Finalized
    if (empData.status === "FINALIZED") {
      await prisma.fitnessDecision.create({
        data: {
          employeeId: emp.id,
          doctorId: doctor.id,
          fitnessStatus: empData.fitness,
          adviceListJson: JSON.stringify(empData.advice),
          doctorRemarks: "Clinically fit for occupational duties in current manufacturing department.",
          restrictions: empData.restriction || null,
        },
      });

      // Notification entry
      await prisma.notificationQueue.create({
        data: {
          employeeId: emp.id,
          channel: "WHATSAPP",
          recipient: empData.mobile,
          messageText: `Dear ${empData.fullName}, your annual occupational health surveillance at ${tataCompany.name} is complete. Your Health Card (ID: ${empData.healthId}) and Detailed Medical Dossier are ready.`,
          status: "SENT",
          attempts: 1,
        },
      });
    }
  }

  console.log("Database seeded successfully with demo companies, staff accounts, camp counters, and employees!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
