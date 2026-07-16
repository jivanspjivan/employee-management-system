import 'dotenv/config'

import bcrypt from 'bcrypt'
import { z } from 'zod'

import { prisma } from '../src/config/database.js'
import { logger } from '../src/config/logger.js'
import { EmployeeRole, EmployeeStatus } from '../src/generated/prisma/enums.js'

const requiredEnvironmentVariable = (name: string) => {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required to seed the database`)
  }

  return value
}

const seed = async () => {
  const email = z
    .email('SEED_SUPER_ADMIN_EMAIL must be a valid email address')
    .parse(requiredEnvironmentVariable('SEED_SUPER_ADMIN_EMAIL').toLowerCase())
  const password = requiredEnvironmentVariable('SEED_SUPER_ADMIN_PASSWORD')
  const name = requiredEnvironmentVariable('SEED_SUPER_ADMIN_NAME')
  const employeeId = requiredEnvironmentVariable('SEED_SUPER_ADMIN_EMPLOYEE_ID')

  if (password.length < 12) {
    throw new Error('SEED_SUPER_ADMIN_PASSWORD must contain at least 12 characters')
  }

  const department = await prisma.department.upsert({
    where: { name: 'Administration' },
    update: {},
    create: { name: 'Administration' },
  })

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.employee.upsert({
    where: { employeeId },
    update: {
      email,
      name,
      passwordHash,
      departmentId: department.id,
      designation: 'System Administrator',
      role: EmployeeRole.SUPER_ADMIN,
      status: EmployeeStatus.ACTIVE,
      isDeleted: false,
      deletedAt: null,
    },
    create: {
      employeeId,
      name,
      email,
      passwordHash,
      departmentId: department.id,
      designation: 'System Administrator',
      salary: 0,
      joiningDate: new Date(),
      role: EmployeeRole.SUPER_ADMIN,
      status: EmployeeStatus.ACTIVE,
    },
  })

  logger.info('Super Admin seed completed')
}

seed()
  .catch((error: unknown) => {
    logger.error('Database seed failed', {
      error:
        error instanceof Error
          ? { message: error.message, name: error.name, stack: error.stack }
          : { message: 'Unknown error type' },
    })
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
