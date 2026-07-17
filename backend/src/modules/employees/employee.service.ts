import bcrypt from 'bcrypt'

import { prisma } from '../../config/database.js'
import { AppError } from '../../errors/app-error.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'
import type {
  CreateEmployeeInput,
  EmployeeListQuery,
  EmployeeSearchQuery,
  UpdateEmployeeInput,
} from './employee.schema.js'
import { employeeListSelect } from './employee.types.js'

type ActingEmployee = {
  id: string
  role: EmployeeRole
}

export const listEmployees = async (query: EmployeeListQuery) => {
  const { search, departmentId, role, status, sortBy, sortOrder, page, limit } = query
  const where: Prisma.EmployeeWhereInput = {
    isDeleted: false,
    ...(departmentId && { departmentId }),
    ...(role && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: employeeListSelect,
    }),
    prisma.employee.count({ where }),
  ])

  return {
    employees,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const searchEmployees = async ({ q, limit }: EmployeeSearchQuery) => {
  const matches = await prisma.employee.findMany({
    where: {
      isDeleted: false,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
    take: limit + 1,
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
    },
  })

  return {
    employees: matches.slice(0, limit),
    hasMore: matches.length > limit,
  }
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

export const getDirectReportees = async (id: string) => {
  await getEmployeeById(id)

  return prisma.employee.findMany({
    where: { reportingManagerId: id, isDeleted: false },
    orderBy: { name: 'asc' },
    select: employeeListSelect,
  })
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

export const updateEmployee = async (
  id: string,
  input: UpdateEmployeeInput,
  actor: ActingEmployee,
) => {
  const existingEmployee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, role: true, status: true },
  })

  if (!existingEmployee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found')
  }

  if (actor.role === EmployeeRole.HR_MANAGER && existingEmployee.role === EmployeeRole.SUPER_ADMIN) {
    throw new AppError(
      403,
      'INSUFFICIENT_PERMISSIONS',
      'HR Managers cannot modify a Super Admin',
    )
  }

  if (actor.id === id && input.role !== undefined && input.role !== actor.role) {
    throw new AppError(400, 'CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role')
  }

  const removesActiveSuperAdmin =
    existingEmployee.role === EmployeeRole.SUPER_ADMIN &&
    existingEmployee.status === EmployeeStatus.ACTIVE &&
    ((input.role !== undefined && input.role !== EmployeeRole.SUPER_ADMIN) ||
      (input.status !== undefined && input.status !== EmployeeStatus.ACTIVE))

  if (removesActiveSuperAdmin) {
    const activeSuperAdminCount = await prisma.employee.count({
      where: {
        role: EmployeeRole.SUPER_ADMIN,
        status: EmployeeStatus.ACTIVE,
        isDeleted: false,
      },
    })

    if (activeSuperAdminCount <= 1) {
      throw new AppError(
        409,
        'LAST_SUPER_ADMIN_REQUIRED',
        'The last active Super Admin cannot be demoted or deactivated',
      )
    }
  }

  if (input.employeeId || input.email) {
    const duplicate = await prisma.employee.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(input.employeeId ? [{ employeeId: input.employeeId }] : []),
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
      select: { id: true },
    })

    if (duplicate) {
      throw new AppError(
        409,
        'EMPLOYEE_ALREADY_EXISTS',
        'An employee with this employee ID or email already exists',
      )
    }
  }

  if (input.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      select: { id: true },
    })

    if (!department) {
      throw new AppError(400, 'DEPARTMENT_NOT_FOUND', 'Department does not exist')
    }
  }

  return prisma.employee.update({
    where: { id },
    data: input,
    select: employeeListSelect,
  })
}

export const deleteEmployee = async (id: string) => {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, role: true, status: true },
  })

  if (!employee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found')
  }

  if (
    employee.role === EmployeeRole.SUPER_ADMIN &&
    employee.status === EmployeeStatus.ACTIVE
  ) {
    const activeSuperAdminCount = await prisma.employee.count({
      where: {
        role: EmployeeRole.SUPER_ADMIN,
        status: EmployeeStatus.ACTIVE,
        isDeleted: false,
      },
    })

    if (activeSuperAdminCount <= 1) {
      throw new AppError(
        409,
        'LAST_SUPER_ADMIN_REQUIRED',
        'The last active Super Admin cannot be deleted',
      )
    }
  }

  return prisma.employee.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: EmployeeStatus.INACTIVE,
      tokenVersion: { increment: 1 },
    },
    select: {
      id: true,
      employeeId: true,
      name: true,
      deletedAt: true,
    },
  })
}

export const assignManager = async (employeeId: string, reportingManagerId: string | null) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, isDeleted: false },
    select: { id: true },
  })

  if (!employee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found')
  }

  if (reportingManagerId === employeeId) {
    throw new AppError(400, 'CIRCULAR_REPORTING', 'An employee cannot report to themselves')
  }

  if (reportingManagerId) {
    let manager = await prisma.employee.findFirst({
      where: { id: reportingManagerId, isDeleted: false },
      select: { id: true, reportingManagerId: true },
    })

    if (!manager) {
      throw new AppError(400, 'REPORTING_MANAGER_NOT_FOUND', 'Reporting manager does not exist')
    }

    const visitedEmployeeIds = new Set<string>()

    while (manager) {
      if (manager.id === employeeId || visitedEmployeeIds.has(manager.id)) {
        throw new AppError(400, 'CIRCULAR_REPORTING', 'This manager assignment creates a cycle')
      }

      visitedEmployeeIds.add(manager.id)

      if (!manager.reportingManagerId) {
        break
      }

      manager = await prisma.employee.findFirst({
        where: { id: manager.reportingManagerId, isDeleted: false },
        select: { id: true, reportingManagerId: true },
      })
    }
  }

  return prisma.employee.update({
    where: { id: employeeId },
    data: { reportingManagerId },
    select: employeeListSelect,
  })
}
