import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { maskMobileNumber } from "@/lib/mask";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ counterId: string }> }
) {
  try {
    const { counterId } = await context.params;
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.toLowerCase().trim();

    const counter = await prisma.campCounter.findUnique({
      where: { id: counterId },
      include: {
        camp: {
          include: {
            counters: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    });

    if (!counter) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    const session = await getSession(req);
    const isCounter2 =
      counter.counterNo === 2 ||
      counter.code === "VITALS" ||
      counter.counterType === "VITALS_VISION";
    const isCounter1 =
      counter.counterNo === 1 ||
      counter.code === "REG" ||
      counter.counterType === "REGISTRATION";

    if (session && session.role !== "SUPER_ADMIN") {
      if (session.role === "DOCTOR_ASSISTANT") {
        if (!isCounter2) {
          return NextResponse.json({ error: "Access restricted to Counter 2 only." }, { status: 403 });
        }
      } else if (session.role === "REGISTRATION_DESK") {
        if (!isCounter1) {
          return NextResponse.json({ error: "Access restricted to Counter 1 only." }, { status: 403 });
        }
      }
    }

    const visits = await prisma.counterVisit.findMany({
      where: {
        campCounterId: counterId,
        ...(search
          ? {
              employee: {
                OR: [
                  { healthId: { contains: search } },
                  { employeeCode: { contains: search } },
                  { fullName: { contains: search } },
                ],
              },
            }
          : {}),
      },
      include: {
        employee: {
          include: {
            vitalsVision: true,
            bloodResult: true,
            diagnosticResults: true,
            doctorExamination: true,
            fitnessDecision: true,
            counterVisits: {
              include: {
                campCounter: true,
              },
            },
          },
        },
        diagnosticResults: true,
        attachments: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Check prerequisites for each visit:
    // Counter 1: Always ready.
    // Counter 2: Ready when Counter 1 is COMPLETED.
    // Counter 3..7 (Diagnostics): Ready when Counter 1 and Counter 2 are COMPLETED (or previous counter completed).
    // Counter 8 (Doctor): Ready when all diagnostic counters are COMPLETED.
    const enrichedVisits = visits.map((v) => {
      const allVisits = v.employee.counterVisits || [];
      const c1 = allVisits.find(
        (item) =>
          item.campCounter.counterNo === 1 ||
          item.campCounter.code === "REG" ||
          item.campCounter.counterType === "REGISTRATION"
      );
      const c2 = allVisits.find(
        (item) =>
          item.campCounter.counterNo === 2 ||
          item.campCounter.code === "VITALS" ||
          item.campCounter.counterType === "VITALS_VISION"
      );

      let isReady = false;
      let prerequisiteMessage = "Ready for test";

      const isC1 =
        counter.counterNo === 1 ||
        counter.code === "REG" ||
        counter.counterType === "REGISTRATION";

      const isC2 =
        counter.counterNo === 2 ||
        counter.code === "VITALS" ||
        counter.counterType === "VITALS_VISION";

      const isDoctor =
        counter.counterNo === 8 ||
        counter.code === "DOCTOR_EXAM" ||
        counter.counterType === "DOCTOR_EXAMINATION";

      const isBackOffice =
        counter.counterNo === 9 ||
        counter.code === "BACK_OFFICE" ||
        counter.counterType === "BACK_OFFICE";

      if (isC1) {
        isReady = true;
        prerequisiteMessage = "Ready for registration verification & pass";
      } else if (isC2) {
        if (c1?.status === "COMPLETED") {
          isReady = true;
          prerequisiteMessage = "Ready for vitals & vision";
        } else {
          isReady = false;
          prerequisiteMessage = "Waiting for Counter 1 (Registration Desk) to pass";
        }
      } else if (isDoctor) {
        // Doctor Exam: requires all mandatory pre-doctor counters completed
        const diagPending = allVisits.filter(
          (item) =>
            item.campCounter.isMandatory &&
            item.campCounter.counterType !== "DOCTOR_EXAMINATION" &&
            item.campCounter.counterType !== "BACK_OFFICE" &&
            item.status !== "COMPLETED"
        );
        if (diagPending.length === 0) {
          isReady = true;
          prerequisiteMessage = "Ready for doctor examination";
        } else {
          isReady = false;
          prerequisiteMessage = `Waiting for ${diagPending.length} diagnostic counter(s) to pass`;
        }
      } else if (isBackOffice) {
        isReady = true;
      } else {
        // Diagnostic counters (Counters 3..7 and custom specialty stations)
        if (c2?.status === "COMPLETED") {
          isReady = true;
          prerequisiteMessage = "Ready for test";
        } else if (c1?.status === "COMPLETED") {
          isReady = false;
          prerequisiteMessage = "Waiting for Counter 2 (Vitals & Vision) to pass";
        } else {
          isReady = false;
          prerequisiteMessage = "Waiting for Counter 1 (Registration Desk) to pass";
        }
      }

      return {
        ...v,
        isReady,
        prerequisiteMessage,
        completedPrevious: isReady,
      };
    });

    const isOperatorRestricted =
      session &&
      session.role !== "SUPER_ADMIN" &&
      session.role === "DOCTOR_ASSISTANT";

    // For Counter 2 operator, sanitize data so only Counter 2 data is exposed
    const sanitizedVisits = enrichedVisits.map((v) => {
      if (isOperatorRestricted) {
        return {
          id: v.id,
          status: v.status,
          isReady: v.isReady,
          prerequisiteMessage: v.prerequisiteMessage,
          completedAt: v.completedAt,
          campCounterId: v.campCounterId,
          employee: {
            id: v.employee.id,
            healthId: v.employee.healthId,
            employeeCode: v.employee.employeeCode,
            fullName: v.employee.fullName,
            age: v.employee.age,
            sex: v.employee.sex,
            department: v.employee.department,
            designation: v.employee.designation,
            employeeType: v.employee.employeeType,
            heightCm: v.employee.heightCm,
            weightKg: v.employee.weightKg,
            bmi: v.employee.bmi,
            bmiCategory: v.employee.bmiCategory,
            mobile: maskMobileNumber(v.employee.mobile, session?.role),
            // Only Counter 2 data:
            vitalsVision: v.employee.vitalsVision,
          },
        };
      }
      return {
        ...v,
        employee: {
          ...v.employee,
          mobile: maskMobileNumber(v.employee.mobile, session?.role),
        },
      };
    });

    const waiting = sanitizedVisits.filter((v) => v.status === "WAITING");
    const readyWaiting = waiting.filter((v) => v.isReady);
    // Counter 2 operator sees Counter 2 queue ONLY, not Counter 1's pending workers
    const pendingWaiting = isOperatorRestricted ? [] : waiting.filter((v) => !v.isReady);
    const inProgress = sanitizedVisits.filter((v) => v.status === "IN_PROGRESS");
    const completed = sanitizedVisits.filter((v) => v.status === "COMPLETED");

    return NextResponse.json({
      counter,
      waiting,
      readyWaiting,
      pendingWaiting,
      inProgress,
      completed,
      totalCount: sanitizedVisits.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching counter queue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
