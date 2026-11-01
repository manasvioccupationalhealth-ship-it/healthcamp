import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Enable SQLite Write-Ahead Logging (WAL) for concurrent LAN reads and writes
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Execute WAL pragma on SQLite startup in Node server environment (if using SQLite)
if (typeof window === "undefined" && process.env.DATABASE_URL.startsWith("file:")) {
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
}
