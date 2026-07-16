import type { Prisma } from '../../generated/prisma/client.js'

export const employeeListSelect = {
  id: true,
  employeeId: true,
  name: true,
  email: true,
  phone: true,
  designation: true,
  salary: true,
  joiningDate: true,
  status: true,
  role: true,
  profileImageUrl: true,
  departmentId: true,
  reportingManagerId: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  reportingManager: {
    select: {
      id: true,
      employeeId: true,
      name: true,
    },
  },
} satisfies Prisma.EmployeeSelect
