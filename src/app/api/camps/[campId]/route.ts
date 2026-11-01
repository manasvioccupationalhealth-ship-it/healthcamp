import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ campId: string }> }
) {
  try {
    const { campId } = await context.params;
    const session = await getSession(req);

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        company: true,
        counters: {
          orderBy: { displayOrder: "asc" },
          include: {
            assignments: {
              include: { user: true },
            },
            _count: {
              select: { visits: true },
            },
          },
        },
        employees: {
          include: {
            fitnessDecision: true,
            vitalsVision: true,
            diagnosticResults: true,
            bloodResult: true,
            doctorExamination: true,
            counterVisits: {
              include: {
                campCounter: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    if (session?.role === "COMPANY_HR" && session.companyId) {
      if (camp.companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Access denied. You can only view camps and employees belonging to your company." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ camp });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching camp";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
