import { prisma } from '../../config/database.js'
import { invalidateDashboardStats } from '../dashboard/dashboard.cache.js'

export const listDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: {
      _count: {
        select: { employees: { where: { isDeleted: false } } },
      },
      id: true,
      name: true,
    },
  })

  return departments.map(({ _count, ...department }) => ({
    ...department,
    employeeCount: _count.employees,
  }))
}

export const createDepartment = async (name: string) => {
  const department = await prisma.department.create({
    data: { name },
    select: { id: true, name: true },
  })

  await invalidateDashboardStats()
  return department
}
