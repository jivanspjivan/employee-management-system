import { createContext } from 'react'

import type { AuthenticatedEmployee } from '../api/types'
import type { LoginCredentials } from './auth-api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  employee: AuthenticatedEmployee | null
  status: AuthStatus
  login: (credentials: LoginCredentials) => Promise<AuthenticatedEmployee>
  logout: () => Promise<void>
  refreshEmployee: () => Promise<AuthenticatedEmployee | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
