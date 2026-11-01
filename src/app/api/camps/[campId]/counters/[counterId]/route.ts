import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ campId: string; counterId: string }> }
) {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Super Admin required" }, { status: 403 });
  }

  try {
    const { campId, counterId } = await context.params;
    const body = await req.json();
    const {
      name,
      code,
      counterType,
      counterNo,
      isMandatory,
      allowsUpload,
      displayOrder,
    } = body;

    const existing = await prisma.campCounter.findUnique({
      where: { id: counterId },
    });

    if (!existing || existing.campId !== campId) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    const updated = await prisma.campCounter.update({
      where: { id: counterId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        code: code !== undefined ? code.toUpperCase().trim() : existing.code,
        counterType: counterType || existing.counterType,
        counterNo: counterNo !== undefined ? parseInt(counterNo, 10) : existing.counterNo,
        displayOrder:
          displayOrder !== undefined
            ? parseInt(displayOrder, 10)
            : counterNo !== undefined
            ? parseInt(counterNo, 10)
            : existing.displayOrder,
        isMandatory: isMandatory !== undefined ? !!isMandatory : existing.isMandatory,
        allowsUpload: allowsUpload !== undefined ? !!allowsUpload : existing.allowsUpload,
      },
    });

    return NextResponse.json({ success: true, counter: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating counter";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ campId: string; counterId: string }> }
) {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Super Admin required" }, { status: 403 });
  }

  try {
    const { campId, counterId } = await context.params;

    const existing = await prisma.campCounter.findUnique({
      where: { id: counterId },
    });

    if (!existing || existing.campId !== campId) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    await prisma.campCounter.delete({
      where: { id: counterId },
    });

    return NextResponse.json({ success: true, message: "Counter deleted successfully" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error deleting counter";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
