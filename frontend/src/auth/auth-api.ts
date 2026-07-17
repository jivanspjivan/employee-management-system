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
