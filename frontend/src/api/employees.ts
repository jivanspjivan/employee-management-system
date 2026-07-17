import { apiRequest } from './client'
import type { EmployeeListItem, EmployeeRole, EmployeeStatus, PaginationMeta } from './types'

export type EmployeeListResponse = {
  data: {
    employees: EmployeeListItem[]
    pagination: PaginationMeta
  }
}

export type EmployeeListFilters = {
  departmentId?: string
  role?: EmployeeRole
  sortBy?: 'name' | 'joiningDate'
  sortOrder?: 'asc' | 'desc'
  status?: EmployeeStatus
}

export const listEmployeesRequest = (
  page: number,
  limit = 10,
  filters: EmployeeListFilters = {},
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.departmentId) query.set('departmentId', filters.departmentId)
  if (filters.role) query.set('role', filters.role)
  if (filters.sortBy) query.set('sortBy', filters.sortBy)
  if (filters.sortOrder) query.set('sortOrder', filters.sortOrder)
  if (filters.status) query.set('status', filters.status)
  return apiRequest<EmployeeListResponse>(`/employees?${query.toString()}`, { signal })
}

export type CreateEmployeeCsvInput = {
  employeeId: string
  name: string
  email: string
  password: string
  phone?: string
  departmentId: string
  designation: string
  salary: number
  joiningDate: string
  status?: EmployeeStatus
  role?: EmployeeRole
  reportingManagerId?: string
  profileImageUrl?: string
}

export const createEmployeeRequest = (employee: CreateEmployeeCsvInput) =>
  apiRequest('/employees', { body: employee, method: 'POST' })

export const updateEmployeeStatusRequest = (employeeId: string, status: EmployeeStatus) =>
  apiRequest(`/employees/${employeeId}`, { body: { status }, method: 'PUT' })

export const deleteEmployeeRequest = (employeeId: string) =>
  apiRequest(`/employees/${employeeId}`, { method: 'DELETE' })
