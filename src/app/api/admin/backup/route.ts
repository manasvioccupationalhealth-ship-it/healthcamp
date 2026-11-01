import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const dbPath = path.resolve(process.cwd(), "dev.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Database file not found" }, { status: 404 });
    }

    const backupDir = path.resolve(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `healthcamp_backup_${timestamp}.db`;
    const backupFilePath = path.join(backupDir, backupFileName);

    fs.copyFileSync(dbPath, backupFilePath);

    return NextResponse.json({
      success: true,
      backupFileName,
      backupFilePath,
      fileSizeBytes: fs.statSync(backupFilePath).size,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Backup error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
