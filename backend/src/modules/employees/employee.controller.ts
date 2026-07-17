import type { RequestHandler } from 'express'
import { fileURLToPath } from 'node:url'

import { AppError } from '../../errors/app-error.js'
import {
  canEditEmployeeField,
  isEditableEmployeeField,
} from '../../config/employee-field-permissions.js'
import { EmployeeRole } from '../../generated/prisma/enums.js'
import {
  assignManagerSchema,
  createEmployeeSchema,
  csvImportJobSchema,
  employeeIdParamSchema,
  employeeListQuerySchema,
  employeeSearchQuerySchema,
  updateEmployeeSchema,
} from './employee.schema.js'
import * as employeeService from './employee.service.js'
import * as csvJobService from './employee-csv-job.service.js'

const employeeImportTemplatePath = fileURLToPath(
  new URL('../../../public/templates/employee-import-template.csv', import.meta.url),
)

export const listEmployees: RequestHandler = async (request, response) => {
  const query = employeeListQuerySchema.parse(request.query)
  const { employees, pagination } = await employeeService.listEmployees(query)

  response.status(200).json({ data: { employees, pagination } })
}

export const searchEmployees: RequestHandler = async (request, response) => {
  const query = employeeSearchQuerySchema.parse(request.query)
  const result = await employeeService.searchEmployees(query)

  response.status(200).json({ data: result })
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

export const getDirectReportees: RequestHandler = async (request, response) => {
  const { id } = employeeIdParamSchema.parse(request.params)

  if (!request.employee) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  if (request.employee.role === EmployeeRole.EMPLOYEE && request.employee.id !== id) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSIONS',
      "You do not have permission to view this employee's reportees",
    )
  }

  const reportees = await employeeService.getDirectReportees(id)

  response.status(200).json({ data: { reportees } })
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

  const editScope = isOwnEmployeeProfile ? 'selfEdit' : 'edit'
  const restrictedFields = Object.keys(request.body as Record<string, unknown>).filter(
    (field) =>
      isEditableEmployeeField(field) &&
      !canEditEmployeeField(request.employee!.role, editScope, field),
  )

  if (restrictedFields.length > 0) {
    throw new AppError(
      403,
      'FIELD_EDIT_NOT_ALLOWED',
      `You do not have permission to edit: ${restrictedFields.join(', ')}`,
    )
  }

  const input = updateEmployeeSchema.parse(request.body)

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

  const employee = await employeeService.updateEmployee(id, input, {
    id: request.employee.id,
    role: request.employee.role,
  })

  response.status(200).json({
    message: 'Employee updated successfully',
    data: { employee },
  })
}

export const deleteEmployee: RequestHandler = async (request, response) => {
  const { id } = employeeIdParamSchema.parse(request.params)

  if (!request.employee) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  if (request.employee.id === id) {
    throw new AppError(400, 'CANNOT_DELETE_SELF', 'You cannot delete your own account')
  }

  const employee = await employeeService.deleteEmployee(id)

  response.status(200).json({
    message: 'Employee deleted successfully',
    data: { employee },
  })
}

export const assignManager: RequestHandler = async (request, response) => {
  const { id } = employeeIdParamSchema.parse(request.params)
  const { reportingManagerId } = assignManagerSchema.parse(request.body)
  const employee = await employeeService.assignManager(id, reportingManagerId)

  response.status(200).json({
    message: reportingManagerId ? 'Reporting manager assigned successfully' : 'Reporting manager removed',
    data: { employee },
  })
}

const requireCsvActor = (request: Parameters<RequestHandler>[0]) => {
  if (!request.employee) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  return { id: request.employee.id, role: request.employee.role }
}

export const startEmployeeImport: RequestHandler = async (request, response) => {
  const { csv } = csvImportJobSchema.parse(request.body)
  const job = await csvJobService.startImportJob(csv, requireCsvActor(request))
  response.status(202).json({ message: 'Employee import started', data: { job } })
}

export const startEmployeeExport: RequestHandler = async (request, response) => {
  const job = await csvJobService.startExportJob(requireCsvActor(request))
  response.status(202).json({ message: 'Employee export started', data: { job } })
}

export const getEmployeeCsvJob: RequestHandler = async (request, response) => {
  const { id } = employeeIdParamSchema.parse(request.params)
  const actor = requireCsvActor(request)
  const job = await csvJobService.getCsvJob(id, actor.id)
  response.status(200).json({ data: { job } })
}

export const downloadEmployeeImportTemplate: RequestHandler = (_request, response, next) => {
  response.download(employeeImportTemplatePath, 'playstack-employee-import-template.csv', (error) => {
    if (error) next(error)
  })
}
