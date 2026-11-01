import { prisma } from "./db";

/**
 * Generates a collision-safe, permanent Health ID.
 * Format: [PREFIX]-[YEAR]-[0001] (e.g. TAS-2026-0001)
 */
export async function generateHealthId(campId: string, companyPrefix?: string): Promise<string> {
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: { company: true },
  });

  if (!camp) {
    throw new Error("Camp not found");
  }

  const prefix = companyPrefix || camp.company.codePrefix || "CMP";
  const year = new Date(camp.startDate || Date.now()).getFullYear();
  const searchPattern = `${prefix}-${year}-`;

  // Find the highest sequence for this prefix and year
  const latestEmployees = await prisma.employee.findMany({
    where: {
      healthId: {
        startsWith: searchPattern,
      },
    },
    select: { healthId: true },
    orderBy: { healthId: "desc" },
    take: 10,
  });

  let maxSeq = 0;
  for (const emp of latestEmployees) {
    const parts = emp.healthId.split("-");
    const lastPart = parts[parts.length - 1];
    const seq = parseInt(lastPart, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  // Also ensure count-based fallback to avoid gaps
  const count = await prisma.employee.count({
    where: { campId },
  });

  const nextSeq = Math.max(maxSeq + 1, count + 1);
  const formattedSeq = String(nextSeq).padStart(4, "0");

  return `${prefix}-${year}-${formattedSeq}`;
}

export { generateOfflineTempId } from "./temp-id";
