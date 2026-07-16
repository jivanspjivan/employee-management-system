import 'dotenv/config'

import { PrismaNeon } from '@prisma/adapter-neon'

import { PrismaClient } from '../generated/prisma/client.js'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const adapter = new PrismaNeon({ connectionString: databaseUrl })

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
