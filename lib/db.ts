import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 2,                    // Keep 2 connections warm — eliminates cold start lag
    max: 10,                   // Allow up to 10 concurrent connections
    idleTimeoutMillis: 30000,  // Keep idle connections alive for 30s
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({
    adapter,
    log: ["error"],            // Only log errors — removes query/warn overhead
  });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;

