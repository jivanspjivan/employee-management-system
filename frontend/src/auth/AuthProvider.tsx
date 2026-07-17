import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { ApiError } from '../api/client'
import type { AuthenticatedEmployee } from '../api/types'
import { currentEmployeeRequest, loginRequest, logoutRequest, type LoginCredentials } from './auth-api'
import { AuthContext, type AuthStatus } from './auth-context'
import { AUTH_SESSION_EXPIRED_EVENT, tokenStorage } from './token-storage'

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [employee, setEmployee] = useState<AuthenticatedEmployee | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refreshEmployee = useCallback(async () => {
    if (!tokenStorage.get()) {
      setEmployee(null)
      setStatus('unauthenticated')
      return null
    }

    try {
      const response = await currentEmployeeRequest()
      setEmployee(response.data.employee)
      setStatus('authenticated')
      return response.data.employee
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        tokenStorage.clear()
        setEmployee(null)
        setStatus('unauthenticated')
        return null
      }
      setStatus('unauthenticated')
      throw error
    }
  }, [])

  useEffect(() => {
    void refreshEmployee().catch(() => {
      setEmployee(null)
      setStatus('unauthenticated')
    })
  }, [refreshEmployee])

  useEffect(() => {
    const handleExpiredSession = () => {
      setEmployee(null)
      setStatus('unauthenticated')
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginRequest(credentials)
    tokenStorage.set(response.data.token)
    setEmployee(response.data.employee)
    setStatus('authenticated')
    return response.data.employee
  }, [])

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.get()) await logoutRequest()
    } finally {
      tokenStorage.clear()
      setEmployee(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo(
    () => ({ employee, status, login, logout, refreshEmployee }),
    [employee, status, login, logout, refreshEmployee],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
