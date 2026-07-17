import { apiRequest } from './client'
import type { DepartmentSummary } from './types'

export const listDepartmentsRequest = (signal?: AbortSignal) =>
  apiRequest<{ data: { departments: DepartmentSummary[] } }>('/departments', { signal })

export const createDepartmentRequest = (name: string) =>
  apiRequest<{ data: { department: DepartmentSummary } }>('/departments', { body: { name }, method: 'POST' })
