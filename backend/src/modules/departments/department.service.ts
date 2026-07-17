import { prisma } from '../../config/database.js'

export const listDepartments = () =>
  prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  })
