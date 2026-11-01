import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NotificationService } from "@/lib/notifications";
import { calculateBmi } from "@/lib/bmi";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ counterId: string }> }
) {
  try {
    const { counterId } = await context.params;
    const body = await req.json();
    const session = await getSession(req);

    const {
      employeeId,
      // Counter 1 fields
      heightCm,
      weightKg,
      // Vitals fields
      systolicBp,
      diastolicBp,
      pulse,
      distantVisionRight,
      distantVisionLeft,
      nearVisionRight,
      nearVisionLeft,
      withGlasses,
      colorVision,
      notes,
      // Diagnostic fields
      testType,
      numericalData,
      findings,
      conclusion,
      reportUrl,
      // Blood fields
      bloodParameters,
      labReportUrl,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    const counter = await prisma.campCounter.findUnique({
      where: { id: counterId },
      include: { camp: true },
    });

    if (!counter) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    if (session && session.role !== "SUPER_ADMIN") {
      if (session.role === "DOCTOR_ASSISTANT") {
        if (counter.counterNo !== 2 && counter.code !== "VITALS" && counter.counterType !== "VITALS_VISION") {
          return NextResponse.json(
            { error: "Access denied. Doctor Assistant is scoped to Counter 2 only." },
            { status: 403 }
          );
        }
      } else if (session.role === "REGISTRATION_DESK") {
        if (counter.counterNo !== 1 && counter.code !== "REG" && counter.counterType !== "REGISTRATION") {
          return NextResponse.json(
            { error: "Access denied. Registration Desk is scoped to Counter 1 only." },
            { status: 403 }
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // 0. If Registration Desk (Counter 1)
      const isCounter1 =
        counter.counterNo === 1 ||
        counter.code === "REG" ||
        counter.counterType === "REGISTRATION";

      if (isCounter1 && (heightCm || weightKg)) {
        const heightNum = parseFloat(heightCm);
        const weightNum = parseFloat(weightKg);
        if (!isNaN(heightNum) && !isNaN(weightNum) && heightNum > 0 && weightNum > 0) {
          const { bmi, category } = calculateBmi(heightNum, weightNum);
          await tx.employee.update({
            where: { id: employeeId },
            data: {
              heightCm: heightNum,
              weightKg: weightNum,
              bmi,
              bmiCategory: category,
            },
          });
        }
      }
      // 1. If Vitals / Doctor Assistant
      if (counter.counterType === "VITALS_VISION" || systolicBp) {
        await tx.vitalsVision.upsert({
          where: { employeeId },
          create: {
            employeeId,
            systolicBp: parseInt(systolicBp, 10),
            diastolicBp: parseInt(diastolicBp, 10),
            pulse: pulse ? parseInt(pulse, 10) : null,
            distantVisionRight: distantVisionRight || "6/6",
            distantVisionLeft: distantVisionLeft || "6/6",
            nearVisionRight: nearVisionRight || "N6",
            nearVisionLeft: nearVisionLeft || "N6",
            withGlasses: !!withGlasses,
            colorVision: colorVision || "Normal",
            notes: notes || null,
            recordedBy: session?.name || "Assistant",
          },
          update: {
            systolicBp: parseInt(systolicBp, 10),
            diastolicBp: parseInt(diastolicBp, 10),
            pulse: pulse ? parseInt(pulse, 10) : null,
            distantVisionRight: distantVisionRight || "6/6",
            distantVisionLeft: distantVisionLeft || "6/6",
            nearVisionRight: nearVisionRight || "N6",
            nearVisionLeft: nearVisionLeft || "N6",
            withGlasses: !!withGlasses,
            colorVision: colorVision || "Normal",
            notes: notes || null,
          },
        });
      }

      // 2. If Blood collection / Lab
      if (counter.counterType === "BLOOD_COLLECTION" || bloodParameters || labReportUrl) {
        await tx.bloodResult.upsert({
          where: { employeeId },
          create: {
            employeeId,
            parametersJson: bloodParameters ? JSON.stringify(bloodParameters) : null,
            labReportUrl: labReportUrl || null,
            isVerified: true,
            verifiedBy: session?.name || "Lab Staff",
            verifiedAt: new Date(),
          },
          update: {
            parametersJson: bloodParameters ? JSON.stringify(bloodParameters) : undefined,
            labReportUrl: labReportUrl || undefined,
            isVerified: true,
            verifiedBy: session?.name || "Lab Staff",
            verifiedAt: new Date(),
          },
        });
      }

      // 3. If Diagnostic Test (ECG, PFT, Audio, X-Ray, etc.)
      const type = testType || counter.code;
      if (["ECG", "PFT", "AUDIOMETRY", "CHEST_XRAY", "XRAY", "AUDIO"].includes(type) || findings) {
        await tx.diagnosticResult.create({
          data: {
            employeeId,
            testType: type,
            numericalData: numericalData ? JSON.stringify(numericalData) : null,
            findings: findings || "Within normal limits",
            conclusion: conclusion || "Normal",
            reportUrl: reportUrl || null,
            verifiedBy: session?.name || "Technician",
          },
        });
      }

      // 4. Update the visit record for this counter
      await tx.counterVisit.updateMany({
        where: {
          employeeId,
          campCounterId: counterId,
        },
        data: {
          status: "COMPLETED",
          operatorId: session?.userId || null,
          completedAt: new Date(),
          notes: notes || null,
        },
      });

      // 5. Check overall camp progress for this employee
      const visits = await tx.counterVisit.findMany({
        where: { employeeId },
        include: { campCounter: true },
      });

      const allMandatoryCompleted = visits
        .filter((v) => v.campCounter.isMandatory && v.campCounter.counterType !== "DOCTOR_EXAMINATION" && v.campCounter.counterType !== "BACK_OFFICE")
        .every((v) => v.status === "COMPLETED");

      if (allMandatoryCompleted) {
        await tx.employee.update({
          where: { id: employeeId },
          data: { status: "PENDING_DOCTOR" },
        });

        // Trigger notification queue
        await NotificationService.sendHealthCheckCompleteNotification(employeeId).catch(() => {});
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error submitting counter data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
