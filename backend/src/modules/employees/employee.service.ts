import bcrypt from 'bcrypt'

import { prisma } from '../../config/database.js'
import { AppError } from '../../errors/app-error.js'
import type { CreateEmployeeInput } from './employee.schema.js'
import { employeeListSelect } from './employee.types.js'

export const listEmployees = () => {
  return prisma.employee.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'asc' },
    select: employeeListSelect,
  })
}

export const getEmployeeById = async (id: string) => {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
    select: employeeListSelect,
  })

  if (!employee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found')
  }

  return employee
}

export const createEmployee = async (input: CreateEmployeeInput) => {
  const duplicate = await prisma.employee.findFirst({
    where: {
      OR: [{ employeeId: input.employeeId }, { email: input.email }],
    },
    select: { employeeId: true, email: true },
  })

  if (duplicate) {
    throw new AppError(
      409,
      'EMPLOYEE_ALREADY_EXISTS',
      'An employee with this employee ID or email already exists',
    )
  }

  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
    select: { id: true },
  })

  if (!department) {
    throw new AppError(400, 'DEPARTMENT_NOT_FOUND', 'Department does not exist')
  }

  if (input.reportingManagerId) {
    const manager = await prisma.employee.findFirst({
      where: { id: input.reportingManagerId, isDeleted: false },
      select: { id: true },
    })

    if (!manager) {
      throw new AppError(400, 'REPORTING_MANAGER_NOT_FOUND', 'Reporting manager does not exist')
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  const { password, ...employeeData } = input
  void password

  return prisma.employee.create({
    data: {
      ...employeeData,
      passwordHash,
    },
    select: employeeListSelect,
  })
}
