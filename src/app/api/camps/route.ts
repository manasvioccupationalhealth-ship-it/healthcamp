import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";


export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const whereClause: { companyId?: string } = {};

    if (session?.role === "COMPANY_HR" && session.companyId) {
      whereClause.companyId = session.companyId;
    }

    const camps = await prisma.camp.findMany({
      where: whereClause,
    include: {
      company: true,
      counters: {
        orderBy: { displayOrder: "asc" },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          employees: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate detailed counts for each camp
  const campsWithStats = await Promise.all(
    camps.map(async (camp) => {
      const finalizedCount = await prisma.employee.count({
        where: { campId: camp.id, status: "FINALIZED" },
      });
      const pendingDoctorCount = await prisma.employee.count({
        where: { campId: camp.id, status: { in: ["PENDING_DOCTOR", "PENDING_VERIFICATION"] } },
      });
      const inProgressCount = await prisma.employee.count({
        where: { campId: camp.id, status: "IN_PROGRESS" },
      });

      return {
        ...camp,
        stats: {
          totalRegistered: camp._count.employees,
          finalized: finalizedCount,
          pendingDoctor: pendingDoctorCount,
          inProgress: inProgressCount,
        },
      };
    })
  );

    return NextResponse.json({ camps: campsWithStats });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching camps";
    console.error("GET /api/camps error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, companyId, location, startDate, endDate, counters } = body;

    if (!name || !companyId || !location || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required camp fields" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const year = new Date(startDate).getFullYear();
    const campCount = await prisma.camp.count({ where: { companyId } });
    const campIdCode = `${company.codePrefix}-${year}-CAMP${String(campCount + 1).padStart(2, "0")}`;

    const createdCamp = await prisma.$transaction(async (tx) => {
      const camp = await tx.camp.create({
        data: {
          campId: campIdCode,
          name,
          companyId,
          location,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          operatingStatus: "ACTIVE",
        },
      });

      const defaultCounters = counters || [
        { no: 1, name: "Registration Desk", code: "REG", type: "REGISTRATION", order: 1, upload: false, form: true },
        { no: 2, name: "Doctor Assistant (BP & Vision)", code: "VITALS", type: "VITALS_VISION", order: 2, upload: false, form: true },
        { no: 3, name: "Blood Collection & Lab", code: "BLOOD", type: "BLOOD_COLLECTION", order: 3, upload: true, form: true },
        { no: 4, name: "Resting 12-Lead ECG", code: "ECG", type: "ECG", order: 4, upload: true, form: true },
        { no: 5, name: "Pulmonary Function Test (PFT)", code: "PFT", type: "PFT", order: 5, upload: true, form: true },
        { no: 6, name: "Pure Tone Audiometry", code: "AUDIO", type: "AUDIOMETRY", order: 6, upload: true, form: true },
        { no: 7, name: "Digital Chest X-Ray", code: "XRAY", type: "CHEST_XRAY", order: 7, upload: true, form: false },
        { no: 8, name: "Doctor Clinical Examination", code: "DOCTOR_EXAM", type: "DOCTOR_EXAMINATION", order: 8, upload: false, form: true },
        { no: 9, name: "Back Office Verification & Review", code: "BACK_OFFICE", type: "BACK_OFFICE", order: 9, upload: true, form: true },
      ];

      for (const c of defaultCounters) {
        await tx.campCounter.create({
          data: {
            campId: camp.id,
            counterNo: c.no,
            name: c.name,
            code: c.code,
            counterType: c.type || "CUSTOM",
            displayOrder: c.order || c.no,
            isMandatory: true,
            allowsUpload: !!c.upload,
            allowsForm: c.form !== false,
          },
        });
      }

      return camp;
    });

    // Ensure company HR account exists for login
    if (company.registeredEmail) {
      try {
        const existingHr = await prisma.user.findUnique({
          where: { email: company.registeredEmail.toLowerCase().trim() },
        });
        if (!existingHr) {
          const bcrypt = (await import("bcryptjs")).default;
          const passwordHash = await bcrypt.hash("Password@123", 10);
          await prisma.user.create({
            data: {
              email: company.registeredEmail.toLowerCase().trim(),
              name: company.hrContactName || `${company.name} HR`,
              passwordHash,
              role: "COMPANY_HR",
              companyId: company.id,
              mobile: company.hrMobile,
            },
          });
        }
      } catch (e) {
        console.error("Error ensuring HR user on camp creation:", e);
      }
    }

    return NextResponse.json({ success: true, camp: createdCamp });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating camp";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
