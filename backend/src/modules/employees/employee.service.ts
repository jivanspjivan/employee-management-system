import { prisma } from '../../config/database.js'
import { employeeListSelect } from './employee.types.js'

export const listEmployees = () => {
  return prisma.employee.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'asc' },
    select: employeeListSelect,
  })
}
