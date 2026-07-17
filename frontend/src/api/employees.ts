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

export type CreateEmployeeInput = {
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

export type CreateEmployeeCsvInput = CreateEmployeeInput

export const createEmployeeRequest = (employee: CreateEmployeeInput) =>
  apiRequest('/employees', { body: employee, method: 'POST' })

export const getEmployeeRequest = (employeeId: string, signal?: AbortSignal) =>
  apiRequest<{ data: { employee: EmployeeListItem } }>(`/employees/${employeeId}`, { signal })

export const getEmployeeReporteesRequest = (employeeId: string, signal?: AbortSignal) =>
  apiRequest<{ data: { reportees: EmployeeListItem[] } }>(`/employees/${employeeId}/reportees`, { signal })

export type UpdateEmployeeInput = Omit<CreateEmployeeInput, 'employeeId' | 'password' | 'reportingManagerId'>

export const updateEmployeeRequest = (employeeId: string, employee: UpdateEmployeeInput) =>
  apiRequest(`/employees/${employeeId}`, { body: employee, method: 'PUT' })

export const assignEmployeeManagerRequest = (employeeId: string, reportingManagerId: string | null) =>
  apiRequest(`/employees/${employeeId}/manager`, { body: { reportingManagerId }, method: 'PATCH' })

export type UpdateOwnProfileInput = {
  email?: string
  name?: string
  phone?: string | null
  profileImageUrl?: string | null
}

export const updateOwnProfileRequest = (employeeId: string, profile: UpdateOwnProfileInput) =>
  apiRequest(`/employees/${employeeId}`, { body: profile, method: 'PUT' })

export const updateEmployeeStatusRequest = (employeeId: string, status: EmployeeStatus) =>
  apiRequest(`/employees/${employeeId}`, { body: { status }, method: 'PUT' })

export const deleteEmployeeRequest = (employeeId: string) =>
  apiRequest(`/employees/${employeeId}`, { method: 'DELETE' })
