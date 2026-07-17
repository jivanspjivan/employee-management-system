import { useEffect, useState } from 'react'
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { ApiError, apiRequest } from '../api/client'
import type { EmployeeRole } from '../api/types'
import { useAuth } from '../auth'
import { DashboardPage, type DashboardStats } from '../pages/DashboardPage'
import { LoginPage, type LoginCredentials } from '../pages/LoginPage'
import { AppShell, type AppNavItem } from './layout'

const navigation: readonly AppNavItem<EmployeeRole>[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { label: 'My profile', path: '/profile' },
]

const LoadingScreen = () => (
  <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
    <CircularProgress aria-label="Restoring session" />
  </Box>
)

const DashboardRoute = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    apiRequest<{ data: { stats: DashboardStats } }>('/dashboard/stats')
      .then((response) => {
        if (active) setStats(response.data.stats)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard')
        }
      })
    return () => {
      active = false
    }
  }, [])

  return <DashboardPage error={error} loading={!stats && !error} stats={stats} />
}

const ProfileRoute = () => {
  const { employee } = useAuth()
  if (!employee) return null

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h4">My profile</Typography>
        <Typography color="text.secondary">Your authenticated employee record.</Typography>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h6">{employee.name}</Typography>
          <Typography color="text.secondary">{employee.email}</Typography>
          <Typography>{employee.designation} · {employee.department.name}</Typography>
          <Typography variant="body2">Employee ID: {employee.employeeId}</Typography>
          <Typography variant="body2">Role: {employee.role.replaceAll('_', ' ')}</Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

const AuthenticatedApp = () => {
  const { employee, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!employee) return null
  const defaultPath = employee.role === 'EMPLOYEE' ? '/profile' : '/dashboard'

  return (
    <AppShell
      activePath={location.pathname}
      navigation={navigation}
      onLogout={() => void logout()}
      onNavigate={navigate}
      title={location.pathname === '/profile' ? 'My profile' : 'Dashboard'}
      user={{
        avatarUrl: employee.profileImageUrl,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      }}
    >
      <Routes>
        <Route
          path="/dashboard"
          element={employee.role === 'EMPLOYEE' ? <Navigate replace to="/profile" /> : <DashboardRoute />}
        />
        <Route path="/profile" element={<ProfileRoute />} />
        <Route path="*" element={<Navigate replace to={defaultPath} />} />
      </Routes>
    </AppShell>
  )
}

const LoginRoute = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)
    try {
      const employee = await login(credentials)
      navigate(employee.role === 'EMPLOYEE' ? '/profile' : '/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return <LoginPage error={error} loading={loading} onLogin={handleLogin} />
}

export const App = () => {
  const { status } = useAuth()
  if (status === 'loading') return <LoadingScreen />

  if (status === 'unauthenticated') {
    return (
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    )
  }

  return <AuthenticatedApp />
}
