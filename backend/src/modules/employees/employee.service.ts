import { prisma } from '../../config/database.js'
import { AppError } from '../../errors/app-error.js'
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
