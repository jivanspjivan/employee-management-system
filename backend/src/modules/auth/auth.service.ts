import bcrypt from 'bcrypt'

import { prisma } from '../../config/database.js'
import { AppError } from '../../errors/app-error.js'
import { EmployeeStatus } from '../../generated/prisma/enums.js'
import { signAccessToken } from '../../utils/jwt.js'
import type { LoginInput } from './auth.schema.js'
import { authenticatedEmployeeSelect } from './auth.types.js'

export const login = async ({ email, password }: LoginInput) => {
  const record = await prisma.employee.findUnique({
    where: { email },
    select: {
      ...authenticatedEmployeeSelect,
      passwordHash: true,
      tokenVersion: true,
      isDeleted: true,
    },
  })

  if (!record || !(await bcrypt.compare(password, record.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  if (record.isDeleted || record.status !== EmployeeStatus.ACTIVE) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Your account is inactive')
  }

  const token = signAccessToken({
    employeeId: record.id,
    role: record.role,
    tokenVersion: record.tokenVersion,
  })

  const { isDeleted, passwordHash, tokenVersion, ...employee } = record
  void isDeleted
  void passwordHash
  void tokenVersion

  return { employee, token }
}

export const logout = async (employeeId: string, tokenVersion: number) => {
  const result = await prisma.employee.updateMany({
    where: {
      id: employeeId,
      tokenVersion,
    },
    data: {
      tokenVersion: { increment: 1 },
    },
  })

  if (result.count !== 1) {
    throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid')
  }
}
