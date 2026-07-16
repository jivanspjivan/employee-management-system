import type { RequestHandler } from 'express'

import { AppError } from '../../errors/app-error.js'
import { EmployeeRole } from '../../generated/prisma/enums.js'
import { employeeIdParamSchema } from './employee.schema.js'
import * as employeeService from './employee.service.js'

export const listEmployees: RequestHandler = async (_request, response) => {
  const employees = await employeeService.listEmployees()

  response.status(200).json({ data: { employees } })
}

export const getEmployeeById: RequestHandler = async (request, response) => {
  const { id } = employeeIdParamSchema.parse(request.params)

  if (!request.employee) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  if (request.employee.role === EmployeeRole.EMPLOYEE && request.employee.id !== id) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSIONS',
      'You do not have permission to view this employee',
    )
  }

  const employee = await employeeService.getEmployeeById(id)

  response.status(200).json({ data: { employee } })
}
