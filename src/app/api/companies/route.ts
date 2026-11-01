import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";


export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const whereClause: { id?: string } = {};

  if (session?.role === "COMPANY_HR" && session.companyId) {
    whereClause.id = session.companyId;
  }

  const companies = await prisma.company.findMany({
    where: whereClause,
    include: {
      camps: true,
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, codePrefix, address, city, state, pinCode, registeredEmail, hrContactName, hrMobile, amcStartDate, amcEndDate } = body;

    if (!name || !codePrefix || !address || !registeredEmail || !hrContactName || !hrMobile) {
      return NextResponse.json({ error: "Missing required company fields" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        codePrefix: codePrefix.toUpperCase().trim(),
        address,
        city: city || "",
        state: state || "",
        pinCode: pinCode || "",
        registeredEmail: registeredEmail.toLowerCase().trim(),
        hrContactName,
        hrMobile,
        amcStartDate: new Date(amcStartDate || Date.now()),
        amcEndDate: new Date(amcEndDate || Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Automatically create Company HR login account
    try {
      const existingHr = await prisma.user.findUnique({
        where: { email: registeredEmail.toLowerCase().trim() },
      });
      if (!existingHr) {
        const bcrypt = (await import("bcryptjs")).default;
        const passwordHash = await bcrypt.hash("Password@123", 10);
        await prisma.user.create({
          data: {
            email: registeredEmail.toLowerCase().trim(),
            name: hrContactName || `${name} HR`,
            passwordHash,
            role: "COMPANY_HR",
            companyId: company.id,
            mobile: hrMobile,
          },
        });
      }
    } catch (e) {
      console.error("Error creating HR user:", e);
    }

    return NextResponse.json({ success: true, company });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating company";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
