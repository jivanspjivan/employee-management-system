import type { RequestHandler } from 'express'

import { AppError } from '../errors/app-error.js'
import type { EmployeeRole } from '../generated/prisma/enums.js'

export const authorize = (...allowedRoles: EmployeeRole[]): RequestHandler => {
  return (request, _response, next) => {
    if (!request.employee) {
      next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required'))
      return
    }

    if (!allowedRoles.includes(request.employee.role)) {
      next(
        new AppError(
          403,
          'INSUFFICIENT_PERMISSIONS',
          'You do not have permission to perform this action',
        ),
      )
      return
    }

    next()
  }
}
