import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function envOrUndefined(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function createPrismaClient() {
  const connectionString = process.env.VERCEL
    ? envOrUndefined("DATABASE_URL")
    : envOrUndefined("DATABASE_URL") ?? envOrUndefined("DIRECT_URL");

  if (!connectionString) {
    throw new Error(
      process.env.VERCEL
        ? "DATABASE_URL (pooler IPv4) não configurada na Vercel."
        : "DATABASE_URL ou DIRECT_URL não configurada.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    max: process.env.VERCEL ? 1 : 10,
    ssl: connectionString.includes("pooler.supabase.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
