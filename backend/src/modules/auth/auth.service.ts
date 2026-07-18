import bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'

import { prisma } from '../../config/database.js'
import { AppError } from '../../errors/app-error.js'
import { EmployeeStatus } from '../../generated/prisma/enums.js'
import { signAccessToken } from '../../utils/jwt.js'
import { cacheAuthState, invalidateAuthState } from './auth.cache.js'
import type { ForgotPasswordInput, LoginInput } from './auth.schema.js'
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

  await cacheAuthState({
    id: record.id,
    role: record.role,
    status: record.status,
    isDeleted: record.isDeleted,
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

  await invalidateAuthState(employeeId)
}

export const getCurrentEmployee = async (employeeId: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: authenticatedEmployeeSelect,
  })

  if (!employee) {
    throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid')
  }

  return employee
}

export const requestPasswordReset = async ({ email }: ForgotPasswordInput) => {
  const employee = await prisma.employee.findFirst({
    where: { email, isDeleted: false, status: EmployeeStatus.ACTIVE },
    select: { id: true },
  })

  // Always return the same response so this endpoint cannot be used to discover employee accounts.
  if (!employee) return

  const existingRequest = await prisma.passwordResetRequest.findFirst({
    where: { employeeId: employee.id, resolvedAt: null },
    select: { id: true },
  })

  if (!existingRequest) {
    await prisma.passwordResetRequest.create({ data: { employeeId: employee.id } })
  }
}

export const listPasswordResetRequests = () => prisma.passwordResetRequest.findMany({
  orderBy: { requestedAt: 'desc' },
  select: {
    id: true,
    requestedAt: true,
    resolvedAt: true,
    employee: {
      select: { id: true, employeeId: true, name: true, email: true, role: true },
    },
  },
})

const temporaryPassword = () => `Tmp!${randomBytes(9).toString('base64url')}`

export const resolvePasswordResetRequest = async (requestId: string) => {
  const request = await prisma.passwordResetRequest.findFirst({
    where: { id: requestId, resolvedAt: null },
    select: {
      id: true,
      employee: { select: { id: true, isDeleted: true, status: true, role: true } },
    },
  })

  if (!request) throw new AppError(404, 'PASSWORD_RESET_REQUEST_NOT_FOUND', 'Password reset request was not found')
  if (request.employee.isDeleted || request.employee.status !== EmployeeStatus.ACTIVE) {
    throw new AppError(409, 'ACCOUNT_INACTIVE', 'The employee account is inactive')
  }

  const password = temporaryPassword()
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: request.employee.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: { resolvedAt: new Date() },
    }),
  ])

  await invalidateAuthState(request.employee.id)
  return { temporaryPassword: password }
}
