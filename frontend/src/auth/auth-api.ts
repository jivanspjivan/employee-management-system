import { apiRequest } from '../api/client'
import type { AuthenticatedEmployee } from '../api/types'

export type LoginCredentials = {
  email: string
  password: string
}

type LoginResponse = {
  message: string
  data: {
    employee: AuthenticatedEmployee
    token: string
  }
}

type CurrentEmployeeResponse = {
  data: {
    employee: AuthenticatedEmployee
  }
}

export const loginRequest = (credentials: LoginCredentials) =>
  apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
    token: null,
  })

export const logoutRequest = () =>
  apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })

export const currentEmployeeRequest = () =>
  apiRequest<CurrentEmployeeResponse>('/auth/me', { method: 'GET' })

export const forgotPasswordRequest = (email: string) =>
  apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, token: null })

export type PasswordResetRequest = {
  id: string
  requestedAt: string
  resolvedAt: string | null
  employee: {
    id: string
    employeeId: string
    name: string
    email: string
    role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'
  }
}

export const listPasswordResetRequests = () =>
  apiRequest<{ data: { requests: PasswordResetRequest[] } }>('/auth/password-reset-requests')

export const resolvePasswordResetRequest = (id: string) =>
  apiRequest<{ message: string; data: { temporaryPassword: string } }>(`/auth/password-reset-requests/${id}/resolve`, { method: 'POST' })
