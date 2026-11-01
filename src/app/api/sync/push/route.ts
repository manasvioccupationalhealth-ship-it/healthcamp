import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateHealthId } from "@/lib/health-id";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id: clientOpId, entityType, action, payload, clientTimestamp } = body;

    if (!clientOpId || !entityType || !payload) {
      return NextResponse.json({ error: "Missing sync payload parameters" }, { status: 400 });
    }

    // Check idempotency: if already applied, return success
    const existingOp = await prisma.syncOperation.findUnique({
      where: { clientOpId },
    });

    if (existingOp && existingOp.status === "APPLIED") {
      return NextResponse.json({ status: "APPLIED", message: "Already synced" });
    }

    // Record the incoming sync operation
    const syncRecord = await prisma.syncOperation.upsert({
      where: { clientOpId },
      create: {
        clientOpId,
        entityType,
        action: action || "CREATE",
        payloadJson: JSON.stringify(payload),
        status: "PENDING",
        clientTimestamp: new Date(clientTimestamp || Date.now()),
      },
      update: {
        retryCount: { increment: 1 },
      },
    });

    let permanentHealthId = payload.healthId;

    if (entityType === "REGISTRATION") {
      // If client created an offline temp health ID, allocate permanent collision-safe ID
      const camp = await prisma.camp.findUnique({
        where: { id: payload.campId },
        include: { company: true },
      });

      if (!camp) {
        throw new Error("Camp not found during sync");
      }

      const isTemp = !payload.healthId || payload.healthId.startsWith("TMP-");
      if (isTemp) {
        permanentHealthId = await generateHealthId(camp.id, camp.company.codePrefix);
      }

      // Check if employee code already exists in camp
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          campId: camp.id,
          employeeCode: payload.employeeCode,
        },
      });

      if (existingEmployee && existingEmployee.healthId !== permanentHealthId) {
        await prisma.syncOperation.update({
          where: { id: syncRecord.id },
          data: { status: "CONFLICT", conflictReason: `Employee code ${payload.employeeCode} already exists.` },
        });
        return NextResponse.json(
          { status: "CONFLICT", message: `Employee code ${payload.employeeCode} already exists in this camp.` },
          { status: 409 }
        );
      }

      const created = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.create({
          data: {
            campId: camp.id,
            companyId: camp.companyId,
            healthId: permanentHealthId,
            tempHealthId: isTemp ? payload.healthId : null,
            employeeType: payload.employeeType || "COMPANY_STAFF",
            contractorName: payload.contractorName || null,
            employeeCode: payload.employeeCode,
            fullName: payload.fullName,
            dob: new Date(payload.dob),
            age: parseInt(payload.age, 10),
            sex: payload.sex,
            department: payload.department,
            designation: payload.designation,
            tenureYears: parseInt(payload.tenureYears || 0, 10),
            tenureMonths: parseInt(payload.tenureMonths || 0, 10),
            mobile: payload.mobile,
            heightCm: parseFloat(payload.heightCm),
            weightKg: parseFloat(payload.weightKg),
            bmi: parseFloat(payload.bmi),
            bmiCategory: payload.bmiCategory,
            photoUrl: payload.photoUrl || null,
            status: "REGISTERED",
          },
        });

        // Create visits for all active camp counters
        const counters = await tx.campCounter.findMany({
          where: { campId: camp.id },
          orderBy: { displayOrder: "asc" },
        });

        for (const counter of counters) {
          await tx.counterVisit.create({
            data: {
              campId: camp.id,
              campCounterId: counter.id,
              employeeId: emp.id,
              status: counter.displayOrder === 1 ? "COMPLETED" : "WAITING",
              completedAt: counter.displayOrder === 1 ? new Date() : null,
            },
          });
        }

        return emp;
      });

      await prisma.syncOperation.update({
        where: { id: syncRecord.id },
        data: { status: "APPLIED", resolvedAt: new Date() },
      });

      return NextResponse.json({
        status: "APPLIED",
        permanentHealthId: created.healthId,
        employeeId: created.id,
      });
    }

    if (entityType === "VITALS") {
      const employee = await prisma.employee.findUnique({
        where: { healthId: payload.healthId },
      });

      if (!employee) {
        return NextResponse.json({ status: "FAILED", message: "Employee not found" }, { status: 404 });
      }

      await prisma.vitalsVision.upsert({
        where: { employeeId: employee.id },
        create: {
          employeeId: employee.id,
          systolicBp: parseInt(payload.systolicBp, 10),
          diastolicBp: parseInt(payload.diastolicBp, 10),
          pulse: payload.pulse ? parseInt(payload.pulse, 10) : null,
          distantVisionRight: payload.distantVisionRight || "6/6",
          distantVisionLeft: payload.distantVisionLeft || "6/6",
          nearVisionRight: payload.nearVisionRight || "N6",
          nearVisionLeft: payload.nearVisionLeft || "N6",
          withGlasses: !!payload.withGlasses,
          colorVision: payload.colorVision || "Normal",
          notes: payload.notes || null,
        },
        update: {
          systolicBp: parseInt(payload.systolicBp, 10),
          diastolicBp: parseInt(payload.diastolicBp, 10),
          pulse: payload.pulse ? parseInt(payload.pulse, 10) : null,
          distantVisionRight: payload.distantVisionRight,
          distantVisionLeft: payload.distantVisionLeft,
          nearVisionRight: payload.nearVisionRight,
          nearVisionLeft: payload.nearVisionLeft,
          withGlasses: !!payload.withGlasses,
          colorVision: payload.colorVision,
          notes: payload.notes,
        },
      });

      // Update visit status
      if (payload.campCounterId) {
        await prisma.counterVisit.updateMany({
          where: { employeeId: employee.id, campCounterId: payload.campCounterId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      await prisma.syncOperation.update({
        where: { id: syncRecord.id },
        data: { status: "APPLIED", resolvedAt: new Date() },
      });

      return NextResponse.json({ status: "APPLIED" });
    }

    // Default catch-up
    await prisma.syncOperation.update({
      where: { id: syncRecord.id },
      data: { status: "APPLIED", resolvedAt: new Date() },
    });

    return NextResponse.json({ status: "APPLIED" });
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const msg = error instanceof Error ? error.message : "Internal sync failure";
    return NextResponse.json({ status: "FAILED", error: msg }, { status: 500 });
  }
}
