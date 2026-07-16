import type { RequestHandler } from 'express'

import { prisma } from '../config/database.js'
import { AppError } from '../errors/app-error.js'
import { EmployeeStatus } from '../generated/prisma/enums.js'
import { authenticatedEmployeeSelect } from '../modules/auth/auth.types.js'
import { verifyAccessToken } from '../utils/jwt.js'

const getBearerToken = (authorizationHeader?: string) => {
  const [scheme, token, extra] = authorizationHeader?.trim().split(/\s+/) ?? []

  if (scheme !== 'Bearer' || !token || extra) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Bearer token is required')
  }

  return token
}

export const authenticate: RequestHandler = async (request, _response, next) => {
  try {
    const token = getBearerToken(request.headers.authorization)
    const payload = verifyAccessToken(token)
    const employee = await prisma.employee.findUnique({
      where: { id: payload.sub },
      select: {
        ...authenticatedEmployeeSelect,
        isDeleted: true,
        tokenVersion: true,
      },
    })

    if (
      !employee ||
      employee.isDeleted ||
      employee.status !== EmployeeStatus.ACTIVE ||
      employee.tokenVersion !== payload.tokenVersion
    ) {
      throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid')
    }

    const { isDeleted, tokenVersion, ...authenticatedEmployee } = employee
    void isDeleted

    request.authTokenVersion = tokenVersion
    request.employee = authenticatedEmployee
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }

    next(new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid'))
  }
}
