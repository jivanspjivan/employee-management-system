import type { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'

export type OrganizationEmployee = {
  id: string
  employeeId: string
  name: string
  designation: string
  role: EmployeeRole
  status: EmployeeStatus
  profileImageUrl: string | null
  reportingManagerId: string | null
  department: {
    id: string
    name: string
  }
}

export type OrganizationTreeNode = OrganizationEmployee & {
  directReports: OrganizationTreeNode[]
}
