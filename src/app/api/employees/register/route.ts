import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBmi, calculateAge } from "@/lib/bmi";
import { generateHealthId } from "@/lib/health-id";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      campId,
      employeeType,
      contractorName,
      employeeCode,
      fullName,
      dob,
      sex,
      department,
      designation,
      tenureYears,
      tenureMonths,
      mobile,
      heightCm,
      weightKg,
      photoUrl,
      autoPassCounter1 = false,
    } = body;

    if (!campId || !employeeCode || !fullName || !dob || !sex || !department || !designation || !mobile || !heightCm || !weightKg) {
      return NextResponse.json({ error: "Missing required registration fields" }, { status: 400 });
    }

    if (employeeType === "CONTRACT_EMPLOYEE" && !contractorName?.trim()) {
      return NextResponse.json({ error: "Contractor name is required for contract employees" }, { status: 400 });
    }

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        company: true,
        counters: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    const session = await getSession(req);
    if (session?.role === "COMPANY_HR" && session.companyId) {
      if (camp.companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Access denied. You can only register employees for camps belonging to your company." },
          { status: 403 }
        );
      }
    }

    // Duplicate check
    const existing = await prisma.employee.findFirst({
      where: {
        campId,
        employeeCode: employeeCode.trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Employee Code "${employeeCode}" is already registered with Health ID: ${existing.healthId}` },
        { status: 409 }
      );
    }

    const heightNum = parseFloat(heightCm);
    const weightNum = parseFloat(weightKg);
    const { bmi, category } = calculateBmi(heightNum, weightNum);
    const age = calculateAge(dob);
    const healthId = await generateHealthId(camp.id, camp.company.codePrefix);

    const employee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          campId: camp.id,
          companyId: camp.companyId,
          healthId,
          employeeType: employeeType || "COMPANY_STAFF",
          contractorName: employeeType === "CONTRACT_EMPLOYEE" ? contractorName.trim() : null,
          employeeCode: employeeCode.trim(),
          fullName: fullName.trim(),
          dob: new Date(dob),
          age,
          sex,
          department: department.trim(),
          designation: designation.trim(),
          tenureYears: parseInt(tenureYears || 0, 10),
          tenureMonths: parseInt(tenureMonths || 0, 10),
          mobile: mobile.trim(),
          heightCm: heightNum,
          weightKg: weightNum,
          bmi,
          bmiCategory: category,
          photoUrl: photoUrl || null,
          status: "IN_PROGRESS",
        },
      });

      // Create Counter Visits for all configured camp counters
      for (const counter of camp.counters) {
        const isCounter1 =
          counter.counterNo === 1 ||
          counter.displayOrder === 1 ||
          counter.code === "REG" ||
          counter.counterType === "REGISTRATION";

        // Registration desk is not an examination counter: mark registration COMPLETED immediately!
        const markCompleted = isCounter1;

        await tx.counterVisit.create({
          data: {
            campId: camp.id,
            campCounterId: counter.id,
            employeeId: emp.id,
            status: markCompleted ? "COMPLETED" : "WAITING",
            completedAt: markCompleted ? new Date() : null,
            notes: isCounter1 ? "Registered at Employee Registration Desk" : null,
          },
        });
      }

      return emp;
    });

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Registration error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
