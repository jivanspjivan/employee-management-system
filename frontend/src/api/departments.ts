import { apiRequest } from './client'
import type { DepartmentSummary } from './types'

export const listDepartmentsRequest = (signal?: AbortSignal) =>
  apiRequest<{ data: { departments: DepartmentSummary[] } }>('/departments', { signal })
