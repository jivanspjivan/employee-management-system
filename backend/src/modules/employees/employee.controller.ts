import type { RequestHandler } from 'express'

import { AppError } from '../../errors/app-error.js'
import { EmployeeRole } from '../../generated/prisma/enums.js'
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  updateEmployeeSchema,
  updateOwnProfileSchema,
} from './employee.schema.js'
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

export const createEmployee: RequestHandler = async (request, response) => {
  const input = createEmployeeSchema.parse(request.body)

  if (request.employee?.role === EmployeeRole.HR_MANAGER && input.role === EmployeeRole.SUPER_ADMIN) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSIONS',
      'HR Managers cannot assign the Super Admin role',
    )
  }

  const employee = await employeeService.createEmployee(input)

  response.status(201).json({
    message: 'Employee created successfully',
    data: { employee },
  })
}

export const updateEmployee: RequestHandler = async (request, response) => {
  const { id } = employeeIdParamSchema.parse(request.params)

  if (!request.employee) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  const isOwnEmployeeProfile = request.employee.id === id

  if (request.employee.role === EmployeeRole.EMPLOYEE && !isOwnEmployeeProfile) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSIONS',
      'You do not have permission to update this employee',
    )
  }

  const input =
    request.employee.role === EmployeeRole.EMPLOYEE
      ? updateOwnProfileSchema.parse(request.body)
      : updateEmployeeSchema.parse(request.body)

  if (
    request.employee.role === EmployeeRole.HR_MANAGER &&
    'role' in input &&
    input.role === EmployeeRole.SUPER_ADMIN
  ) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSIONS',
      'HR Managers cannot assign the Super Admin role',
    )
  }

  const employee = await employeeService.updateEmployee(id, input)

  response.status(200).json({
    message: 'Employee updated successfully',
    data: { employee },
  })
}
