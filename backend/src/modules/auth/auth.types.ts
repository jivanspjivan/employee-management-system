import type { Prisma } from '../../generated/prisma/client.js'

export const authenticatedEmployeeSelect = {
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
} satisfies Prisma.EmployeeSelect

export type AuthenticatedEmployee = Prisma.EmployeeGetPayload<{
  select: typeof authenticatedEmployeeSelect
}>
