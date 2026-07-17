import type { RequestHandler } from 'express'

import { prisma } from '../config/database.js'
import { AppError } from '../errors/app-error.js'
import { EmployeeStatus } from '../generated/prisma/enums.js'
import {
  cacheAuthState,
  getCachedAuthState,
} from '../modules/auth/auth.cache.js'
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
    let employee = await getCachedAuthState(payload.sub)

    if (!employee) {
      employee = await prisma.employee.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          role: true,
          status: true,
          isDeleted: true,
          tokenVersion: true,
        },
      })

      if (employee) await cacheAuthState(employee)
    }

    if (
      !employee ||
      employee.isDeleted ||
      employee.status !== EmployeeStatus.ACTIVE ||
      employee.tokenVersion !== payload.tokenVersion
    ) {
      throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid')
    }

    request.authTokenVersion = employee.tokenVersion
    request.employee = { id: employee.id, role: employee.role }
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }

    next(new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid'))
  }
}
