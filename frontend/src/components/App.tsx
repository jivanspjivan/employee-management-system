import { useEffect, useState } from 'react'
import { Box, CircularProgress, Paper, SvgIcon, Typography } from '@mui/material'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { ApiError, apiRequest } from '../api/client'
import type { EmployeeRole } from '../api/types'
import { useAuth } from '../auth'
import { DashboardPage, type DashboardStats } from '../pages/DashboardPage'
import type { DashboardChartData } from './dashboard/DashboardCharts'
import { CreateEmployeePage } from '../pages/CreateEmployeePage'
import { EmployeeListPage } from '../pages/EmployeeListPage'
import { EmployeeDetailsPage } from '../pages/EmployeeDetailsPage'
import { EditEmployeePage } from '../pages/EditEmployeePage'
import { DepartmentsPage } from '../pages/DepartmentsPage'
import { LoginPage, type LoginCredentials } from '../pages/LoginPage'
import { ProfilePage } from '../pages/ProfilePage'
import { OrganizationPage } from '../pages/OrganizationPage'
import { AppShell, type AppNavItem } from './layout'

const NavIcon = ({ path }: { path: string }) => <SvgIcon sx={{ fontSize: 20 }}><path d={path} /></SvgIcon>

const navigation: readonly AppNavItem<EmployeeRole>[] = [
  { icon: <NavIcon path="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />, label: 'Dashboard', path: '/dashboard', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: <NavIcon path="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />, label: 'Employees', path: '/employees', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: <NavIcon path="M12 7V3H2v18h20V7H12Zm-6 12H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V9h2v2Zm4 8H8v-2h2v2Zm0-4H8v-2h2v2Zm10 4h-8V9h8v10Z" />, label: 'Departments', path: '/departments', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: <NavIcon path="M15 4a3 3 0 1 0-6 0 3 3 0 0 0 2 2.82V9H6a2 2 0 0 0-2 2v2.18A3 3 0 1 0 6 13v-2h5v2.18a3 3 0 1 0 2 0V11h5v2.18a3 3 0 1 0 2 0V11a2 2 0 0 0-2-2h-5V6.82A3 3 0 0 0 15 4Z" />, label: 'Organization', path: '/organization', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: <NavIcon path="M21 4H3c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h18c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2Zm0 14H3v-6h18v6Zm0-10H3V6h18v2Z" />, label: 'Payroll', path: '/payroll', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: <NavIcon path="m3.5 18.49 6-6.01 4 4L22 6.92 20.59 5.5 13.5 13.48l-4-4L2 16.99l1.5 1.5Z" />, label: 'Performance', path: '/performance' },
  { icon: <NavIcon path="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />, label: 'My profile', path: '/profile' },
  { icon: <NavIcon path="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65-2-3.46-2.49 1a7.2 7.2 0 0 0-1.69-.98L15 3.27h-4l-.4 2.66c-.61.25-1.17.59-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.08.66-.08.98s.03.66.08.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.73 1.69.98l.4 2.66h4l.4-2.66c.61-.25 1.17-.58 1.69-.98l2.49 1 2-3.46-2.15-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z" />, label: 'Settings', path: '/settings' },
]

const LoadingScreen = () => (
  <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
    <CircularProgress aria-label="Restoring session" />
  </Box>
)

const DashboardRoute = () => {
  const navigate = useNavigate()
  const { employee } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<DashboardChartData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartsError, setChartsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    apiRequest<{ data: { stats: DashboardStats } }>('/dashboard/stats')
      .then((response) => {
        if (active) setStats(response.data.stats)
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard')
      })
    apiRequest<{ data: { charts: DashboardChartData } }>('/dashboard/charts')
      .then((response) => {
        if (active) setCharts(response.data.charts)
      })
      .catch((requestError: unknown) => {
        if (active) setChartsError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard charts')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <DashboardPage
      charts={charts}
      chartsError={chartsError}
      chartsLoading={!charts && !chartsError}
      error={error}
      loading={!stats && !error}
      onAddDepartment={() => navigate('/departments/new')}
      onAddEmployee={() => navigate('/employees/new')}
      stats={stats}
      welcomeName={employee?.name}
    />
  )
}

const PlaceholderRoute = ({ title, description = 'This workspace will be available in the next frontend milestone.' }: { title: string; description?: string }) => (
  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 4 }}>
    <Typography component="h1" variant="h4">{title}</Typography>
    <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>
  </Paper>
)

const AuthenticatedApp = () => {
  const { employee, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!employee) return null
  const defaultPath = employee.role === 'EMPLOYEE' ? '/profile' : '/dashboard'
  const currentTitle = navigation.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
  )?.label ?? 'Playstack'

  return (
    <AppShell
      activePath={location.pathname}
      navigation={navigation}
      onLogout={() => void logout()}
      onNavigate={navigate}
      title={currentTitle}
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/employees" element={employee.role === 'EMPLOYEE' ? <Navigate replace to="/profile" /> : <EmployeeListPage />} />
        <Route path="/employees/new" element={employee.role === 'EMPLOYEE' ? <Navigate replace to="/profile" /> : <CreateEmployeePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="/employees/:id/edit" element={employee.role === 'EMPLOYEE' ? <Navigate replace to="/profile" /> : <EditEmployeePage />} />
        <Route path="/departments/*" element={employee.role === 'EMPLOYEE' ? <Navigate replace to="/profile" /> : <DepartmentsPage />} />
        <Route path="/organization" element={employee.role === 'EMPLOYEE' ? <Navigate replace to="/profile" /> : <OrganizationPage />} />
        <Route path="/payroll" element={<PlaceholderRoute description="This page is not yet designed." title="Payroll" />} />
        <Route path="/performance" element={<PlaceholderRoute title="Performance" />} />
        <Route path="/settings" element={<PlaceholderRoute title="Settings" />} />
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
