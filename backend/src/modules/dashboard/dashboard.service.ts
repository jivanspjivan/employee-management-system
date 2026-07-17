import { prisma } from '../../config/database.js'
import { EmployeeStatus } from '../../generated/prisma/enums.js'

export const getDashboardStats = async () => {
  const [totalEmployees, activeEmployees, inactiveEmployees, departmentCount] =
    await Promise.all([
      prisma.employee.count({ where: { isDeleted: false } }),
      prisma.employee.count({
        where: { isDeleted: false, status: EmployeeStatus.ACTIVE },
      }),
      prisma.employee.count({
        where: { isDeleted: false, status: EmployeeStatus.INACTIVE },
      }),
      prisma.department.count(),
    ])

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    departmentCount,
  }
}
