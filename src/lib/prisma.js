import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global;

// 1. Create a pool using the connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Pass the adapter to the constructor
const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}