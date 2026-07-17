export type EmployeeRole = 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'

export type DepartmentSummary = {
  id: string
  name: string
  employeeCount?: number
}

export type AuthenticatedEmployee = {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string | null
  designation: string
  salary: string
  joiningDate: string
  status: EmployeeStatus
  role: EmployeeRole
  profileImageUrl: string | null
  departmentId: string
  reportingManagerId: string | null
  createdAt: string
  updatedAt: string
  department: DepartmentSummary
}

export type EmployeeListItem = AuthenticatedEmployee & {
  reportingManager: {
    id: string
    employeeId: string
    name: string
  } | null
}

export type OrganizationTreeNode = {
  id: string
  employeeId: string
  name: string
  designation: string
  role: EmployeeRole
  status: EmployeeStatus
  profileImageUrl: string | null
  reportingManagerId: string | null
  department: DepartmentSummary
  directReports: OrganizationTreeNode[]
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ApiErrorPayload = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
