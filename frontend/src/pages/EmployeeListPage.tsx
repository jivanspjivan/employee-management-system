import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Pagination,
  Paper,
  MenuItem,
  Menu,
  IconButton,
  Select,
  Stack,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Skeleton,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { listDepartmentsRequest } from '../api/departments'
import { apiRequest } from '../api/client'
import { createEmployeeRequest, deleteEmployeeRequest, listEmployeesRequest, updateEmployeeStatusRequest, type CreateEmployeeCsvInput, type EmployeeListFilters } from '../api/employees'
import type { DepartmentSummary, EmployeeListItem, EmployeeRole, EmployeeStatus, PaginationMeta } from '../api/types'
import { useAuth } from '../auth'

const initialPagination: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 }

const roleLabel = (role: EmployeeListItem['role']) =>
  role.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )

const initialsFor = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()

const departmentAvatarPalette = [
  { background: '#e4eefb', foreground: '#35699a' },
  { background: '#f1e8fb', foreground: '#76509a' },
  { background: '#fbeadb', foreground: '#9a6335' },
  { background: '#e2f2ec', foreground: '#34735b' },
  { background: '#f8e6ec', foreground: '#995068' },
  { background: '#e8ecf8', foreground: '#52679b' },
  { background: '#f4efdc', foreground: '#86702e' },
  { background: '#e4f1f3', foreground: '#397681' },
]

const avatarColorsForDepartment = (departmentId: string) => {
  const hash = [...departmentId].reduce((total, character) => total + character.charCodeAt(0), 0)
  return departmentAvatarPalette[hash % departmentAvatarPalette.length]!
}

const csvValue = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

const parseCsvLine = (line: string) => {
  const values: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]!
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"'
      index += 1
    } else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) {
      values.push(value.trim())
      value = ''
    } else value += character
  }
  values.push(value.trim())
  return values
}

const AddEmployeeIcon = () => (
  <SvgIcon><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6Zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" /></SvgIcon>
)

const EmptyState = () => (
  <Box sx={{ py: 8, textAlign: 'center' }}>
    <Typography sx={{ fontWeight: 700 }}>No employees found</Typography>
    <Typography color="text.secondary" variant="body2">Employee records will appear here.</Typography>
  </Box>
)

export const EmployeeListPage = () => {
  const navigate = useNavigate()
  const { employee: currentEmployee } = useAuth()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [filters, setFilters] = useState<EmployeeListFilters>({})
  const [csvMessage, setCsvMessage] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvWorking, setCsvWorking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null)
  const [actionEmployee, setActionEmployee] = useState<EmployeeListItem | null>(null)
  const [employeeSummary, setEmployeeSummary] = useState({ total: 0, active: 0, inactive: 0 })

  useEffect(() => {
    const controller = new AbortController()
    listDepartmentsRequest(controller.signal)
      .then(({ data }) => setDepartments(data.departments))
      .catch(() => undefined)
    apiRequest<{ data: { stats: { totalEmployees: number; activeEmployees: number; inactiveEmployees: number } } }>('/dashboard/stats', { signal: controller.signal })
      .then(({ data }) => setEmployeeSummary({ total: data.stats.totalEmployees, active: data.stats.activeEmployees, inactive: data.stats.inactiveEmployees }))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    listEmployeesRequest(page, 10, filters, controller.signal)
      .then(({ data }) => {
        setEmployees(data.employees)
        setPagination(data.pagination)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load employees')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [filters, page])

  const updateFilter = (key: keyof EmployeeListFilters, value: string) => {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value || undefined }))
  }

  const toggleSort = (sortBy: 'name' | 'joiningDate') => {
    setPage(1)
    setFilters((current) => ({
      ...current,
      sortBy,
      sortOrder: current.sortBy === sortBy && current.sortOrder === 'asc' ? 'desc' : 'asc',
    }))
  }

  const refreshList = () => setFilters((current) => ({ ...current }))

  const openActions = (target: HTMLElement, employee: EmployeeListItem) => {
    setActionAnchor(target)
    setActionEmployee(employee)
  }

  const closeActions = () => {
    setActionAnchor(null)
    setActionEmployee(null)
  }

  const disableEmployee = async () => {
    if (!actionEmployee) return
    try {
      await updateEmployeeStatusRequest(actionEmployee.id, 'INACTIVE')
      setCsvMessage(`${actionEmployee.name} has been disabled.`)
      refreshList()
    } catch (requestError) {
      setCsvError(requestError instanceof Error ? requestError.message : 'Unable to disable employee')
    } finally {
      closeActions()
    }
  }

  const deleteEmployee = async () => {
    if (!actionEmployee || !window.confirm(`Delete ${actionEmployee.name}? This action will disable access.`)) return
    try {
      await deleteEmployeeRequest(actionEmployee.id)
      setCsvMessage(`${actionEmployee.name} has been deleted.`)
      refreshList()
    } catch (requestError) {
      setCsvError(requestError instanceof Error ? requestError.message : 'Unable to delete employee')
    } finally {
      closeActions()
    }
  }

  const pageIds = employees.map((employee) => employee.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const somePageSelected = pageIds.some((id) => selectedIds.has(id)) && !allPageSelected

  const togglePageSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allPageSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
  }

  const exportEmployees = async () => {
    setCsvWorking(true)
    setCsvError(null)
    setCsvMessage(null)
    try {
      const firstResponse = await listEmployeesRequest(1, 100)
      const allEmployees = [...firstResponse.data.employees]
      for (let nextPage = 2; nextPage <= firstResponse.data.pagination.totalPages; nextPage += 1) {
        const response = await listEmployeesRequest(nextPage, 100)
        allEmployees.push(...response.data.employees)
      }
      const headers = ['employeeId', 'name', 'email', 'password', 'phone', 'departmentId', 'departmentName', 'designation', 'salary', 'joiningDate', 'status', 'role', 'reportingManagerId', 'reportingManagerName', 'profileImageUrl']
      const rows = allEmployees.map((employee) => [
        employee.employeeId, employee.name, employee.email, '', employee.phone, employee.departmentId,
        employee.department.name, employee.designation, employee.salary, employee.joiningDate,
        employee.status, employee.role, employee.reportingManagerId,
        employee.reportingManager?.name ?? '', employee.profileImageUrl,
      ].map(csvValue).join(','))
      const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `playstack-employees-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      setCsvMessage(`Exported ${allEmployees.length} employees.`)
    } catch (requestError) {
      setCsvError(requestError instanceof Error ? requestError.message : 'Unable to export employees')
    } finally {
      setCsvWorking(false)
    }
  }

  const importEmployees = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCsvWorking(true)
    setCsvError(null)
    setCsvMessage(null)
    try {
      const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim())
      const headers = parseCsvLine(lines.shift() ?? '')
      const required = ['employeeId', 'name', 'email', 'password', 'departmentId', 'designation', 'salary', 'joiningDate']
      if (required.some((header) => !headers.includes(header))) {
        throw new Error(`CSV requires columns: ${required.join(', ')}`)
      }
      let imported = 0
      const failures: string[] = []
      for (const [rowIndex, line] of lines.entries()) {
        const values = parseCsvLine(line)
        const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
        const input: CreateEmployeeCsvInput = {
          employeeId: record.employeeId!, name: record.name!, email: record.email!, password: record.password!,
          departmentId: record.departmentId!, designation: record.designation!, salary: Number(record.salary),
          joiningDate: record.joiningDate!,
          ...(record.phone && { phone: record.phone }),
          ...(record.status && { status: record.status as EmployeeStatus }),
          ...(record.role && { role: record.role as EmployeeRole }),
          ...(record.reportingManagerId && { reportingManagerId: record.reportingManagerId }),
          ...(record.profileImageUrl && { profileImageUrl: record.profileImageUrl }),
        }
        try {
          await createEmployeeRequest(input)
          imported += 1
        } catch (rowError) {
          failures.push(`row ${rowIndex + 2}: ${rowError instanceof Error ? rowError.message : 'failed'}`)
        }
      }
      setCsvMessage(`Imported ${imported} of ${lines.length} employees.${failures.length ? ` ${failures.length} failed.` : ''}`)
      if (failures.length) setCsvError(failures.slice(0, 3).join(' · '))
      setPage(1)
      setFilters((current) => ({ ...current }))
    } catch (importError) {
      setCsvError(importError instanceof Error ? importError.message : 'Unable to import employees')
    } finally {
      setCsvWorking(false)
      event.target.value = ''
    }
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography component="h1" sx={{ fontWeight: 750, letterSpacing: '-0.03em' }} variant="h4">Employees</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mt: 0.9 }}>
          <Stack direction="row" spacing={5.5} sx={{ alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ color: 'text.primary', fontSize: '1.08rem', fontWeight: 800, lineHeight: 1 }}>{employeeSummary.total.toLocaleString()}</Typography>
              <Typography sx={{ color: '#8b9890', fontSize: '0.68rem', fontWeight: 400, mt: 0.35 }}>Total</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#2f7d4a', fontSize: '1.08rem', fontWeight: 800, lineHeight: 1 }}>{employeeSummary.active.toLocaleString()}</Typography>
              <Typography sx={{ color: '#8b9890', fontSize: '0.68rem', fontWeight: 400, mt: 0.35 }}>Active</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#c44747', fontSize: '1.08rem', fontWeight: 800, lineHeight: 1 }}>{employeeSummary.inactive.toLocaleString()}</Typography>
              <Typography sx={{ color: '#8b9890', fontSize: '0.68rem', fontWeight: 400, mt: 0.35 }}>Inactive</Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button disabled={csvWorking} onClick={() => void exportEmployees()} size="small" startIcon={<SvgIcon sx={{ fontSize: 18 }}><path d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z" /></SvgIcon>} sx={{ fontSize: '0.75rem', minHeight: 34, px: 1.4 }} variant="outlined">Export CSV</Button>
            <Button disabled={csvWorking} onClick={() => fileInputRef.current?.click()} size="small" startIcon={<SvgIcon sx={{ fontSize: 18 }}><path d="M5 17h14v2H5v-2Zm7-14 7 7h-4v5H9v-5H5l7-7Z" /></SvgIcon>} sx={{ fontSize: '0.75rem', minHeight: 34, px: 1.4 }} variant="outlined">Import bulk</Button>
            <input accept=".csv,text/csv" hidden onChange={(event) => void importEmployees(event)} ref={fileInputRef} type="file" />
            <Button onClick={() => navigate('/employees/new')} size="small" startIcon={<AddEmployeeIcon />} sx={{ fontSize: '0.75rem', minHeight: 34, px: 1.5 }} variant="contained">Add employee</Button>
          </Stack>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {csvMessage && <Alert severity="success" onClose={() => setCsvMessage(null)}>{csvMessage}</Alert>}
      {csvError && <Alert severity="warning" onClose={() => setCsvError(null)}>{csvError}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ alignItems: { md: 'center' }, mt: '8px !important' }}>
        <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 700, mr: 0.5, textTransform: 'uppercase' }}>Filter by</Typography>
        <Select displayEmpty onChange={(event) => updateFilter('status', event.target.value)} size="small" sx={{ bgcolor: 'background.paper', fontSize: '0.78rem', height: 34, minWidth: 145 }} value={filters.status ?? ''}>
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value={'ACTIVE' satisfies EmployeeStatus}>Active</MenuItem>
          <MenuItem value={'INACTIVE' satisfies EmployeeStatus}>Inactive</MenuItem>
        </Select>
        <Select displayEmpty onChange={(event) => updateFilter('departmentId', event.target.value)} size="small" sx={{ bgcolor: 'background.paper', fontSize: '0.78rem', height: 34, minWidth: 210 }} value={filters.departmentId ?? ''}>
          <MenuItem value="">All departments</MenuItem>
          {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
        </Select>
        <Select displayEmpty onChange={(event) => updateFilter('role', event.target.value)} size="small" sx={{ bgcolor: 'background.paper', fontSize: '0.78rem', height: 34, minWidth: 155 }} value={filters.role ?? ''}>
          <MenuItem value="">All roles</MenuItem>
          <MenuItem value={'EMPLOYEE' satisfies EmployeeRole}>Employee</MenuItem>
          <MenuItem value={'HR_MANAGER' satisfies EmployeeRole}>HR Manager</MenuItem>
          <MenuItem value={'SUPER_ADMIN' satisfies EmployeeRole}>Super Admin</MenuItem>
        </Select>
        {Object.values(filters).some(Boolean) && (
          <Button color="inherit" onClick={() => { setFilters({}); setPage(1) }} size="small">Clear filters</Button>
        )}
      </Stack>

      <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: '#dce5df', borderRadius: 1, boxShadow: '0 5px 18px rgba(31, 64, 43, 0.045)', overflow: 'hidden' }}>
        {loading ? (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table aria-label="Loading employees" sx={{ minWidth: 1380 }}>
              <TableBody>
                {Array.from({ length: 8 }, (_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell padding="checkbox"><Skeleton height={22} width={22} /></TableCell>
                    <TableCell sx={{ minWidth: 240 }}><Stack direction="row" spacing={1.25}><Skeleton height={38} variant="circular" width={38} /><Box><Skeleton width={130} /><Skeleton width={170} /></Box></Stack></TableCell>
                    {Array.from({ length: 7 }, (_item, cellIndex) => <TableCell key={cellIndex}><Skeleton width={cellIndex % 2 ? 110 : 80} /></TableCell>)}
                    <TableCell><Skeleton height={28} width={28} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : employees.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {selectedIds.size > 0 && (
              <Stack direction="row" sx={{ alignItems: 'center', bgcolor: '#f1f7f3', borderBottom: '1px solid #dce5df', justifyContent: 'space-between', px: 2, py: 1 }}>
                <Typography sx={{ color: 'primary.main', fontSize: '0.78rem', fontWeight: 700 }}>{selectedIds.size} selected</Typography>
                <Button onClick={() => setSelectedIds(new Set())} size="small">Clear selection</Button>
              </Stack>
            )}
            <TableContainer
              sx={{
                maxHeight: 620,
                overflowX: 'auto',
                scrollbarColor: '#c5d0c9 transparent',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { height: 7, width: 7 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#c5d0c9', border: '2px solid transparent', borderRadius: 8, backgroundClip: 'padding-box' },
                '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#9fb0a5' },
              }}
            >
              <Table aria-label="Employee list" stickyHeader sx={{ minWidth: 1460 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ bgcolor: '#d8e5dc', borderBottom: '1px solid #bdcec2' }}>
                      <Checkbox checked={allPageSelected} indeterminate={somePageSelected} onChange={togglePageSelection} size="small" />
                    </TableCell>
                    {[
                      { heading: 'Employee', sortBy: 'name' as const },
                      { heading: 'Employee ID' },
                      { heading: 'Department' },
                      { heading: 'Designation' },
                      { heading: 'Role' },
                      { heading: 'Status' },
                      { heading: 'Joining date', sortBy: 'joiningDate' as const },
                      { heading: 'Reporting manager' },
                    ].map(({ heading, sortBy }) => (
                      <TableCell
                        key={heading}
                        sx={{
                          bgcolor: '#d8e5dc',
                          borderBottom: '1px solid #bdcec2',
                          boxShadow: '0 2px 5px rgba(31, 64, 43, 0.055)',
                          color: '#35493c',
                          fontSize: '0.72rem',
                          fontWeight: 780,
                          letterSpacing: '0.045em',
                          py: 1.2,
                          textTransform: 'uppercase',
                        }}
                      >
                        {sortBy ? (
                          <TableSortLabel
                            active={filters.sortBy === sortBy}
                            direction={filters.sortBy === sortBy ? filters.sortOrder ?? 'asc' : 'asc'}
                            onClick={() => toggleSort(sortBy)}
                          >
                            {heading}
                          </TableSortLabel>
                        ) : heading}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ bgcolor: '#d8e5dc', borderBottom: '1px solid #bdcec2', color: '#35493c', fontSize: '0.72rem', fontWeight: 780, textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee, employeeIndex) => (
                    <TableRow
                      hover
                      key={employee.id}
                      sx={{
                        bgcolor: employeeIndex % 2 === 0 ? 'background.paper' : '#fbfcfb',
                        transition: 'background-color 150ms ease, box-shadow 150ms ease',
                        '& td': { borderBottom: '1px solid #edf1ee' },
                        '&:hover': { bgcolor: '#f1f7f3', boxShadow: 'inset 3px 0 0 #7fa78c' },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedIds.has(employee.id)} onChange={() => toggleEmployeeSelection(employee.id)} size="small" />
                      </TableCell>
                      <TableCell sx={{ minWidth: 240, py: 1.35 }}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <Avatar
                            alt={employee.name}
                            src={employee.profileImageUrl ?? undefined}
                            sx={{
                              bgcolor: avatarColorsForDepartment(employee.departmentId).background,
                              color: avatarColorsForDepartment(employee.departmentId).foreground,
                              fontSize: '0.78rem',
                              fontWeight: 750,
                              height: 38,
                              width: 38,
                            }}
                          >
                            {initialsFor(employee.name)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: '0.84rem', fontWeight: 700 }}>{employee.name}</Typography>
                            <Typography color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>{employee.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{employee.employeeId}</Typography></TableCell>
                      <TableCell sx={{ minWidth: 190 }}>{employee.department.name}</TableCell>
                      <TableCell sx={{ minWidth: 190 }}>{employee.designation}</TableCell>
                      <TableCell>
                        <Chip label={roleLabel(employee.role)} size="small" sx={{ bgcolor: employee.role === 'SUPER_ADMIN' ? '#f1ecff' : employee.role === 'HR_MANAGER' ? '#eaf3ff' : '#f0f2f1', color: employee.role === 'SUPER_ADMIN' ? '#6841a5' : employee.role === 'HR_MANAGER' ? '#356c9d' : '#5f6964', fontSize: '0.68rem', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<Box sx={{ bgcolor: employee.status === 'ACTIVE' ? '#25a55f' : '#d44b4b', borderRadius: '50%', height: 7, width: 7 }} />}
                          label={employee.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{ bgcolor: employee.status === 'ACTIVE' ? '#e7f7ed' : '#fdecec', color: employee.status === 'ACTIVE' ? '#237342' : '#ad3434', fontSize: '0.7rem', fontWeight: 700, '& .MuiChip-icon': { ml: 1 } }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 130 }}>{formatDate(employee.joiningDate)}</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        {employee.reportingManager ? (
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 650 }}>{employee.reportingManager.name}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: '0.68rem' }}>{employee.reportingManager.employeeId}</Typography>
                          </Box>
                        ) : <Typography color="text.secondary" variant="body2">—</Typography>}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton aria-label={`Actions for ${employee.name}`} onClick={(event) => openActions(event.currentTarget, employee)} size="small">
                          <SvgIcon><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z" /></SvgIcon>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', px: 2.5, py: 1.75 }}>
              <Typography color="text.secondary" variant="body2">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </Typography>
              <Pagination color="primary" count={Math.max(pagination.totalPages, 1)} onChange={(_event, nextPage) => setPage(nextPage)} page={pagination.page} shape="rounded" />
            </Stack>
          </>
        )}
      </Paper>

      <Menu anchorEl={actionAnchor} onClose={closeActions} open={Boolean(actionAnchor)}>
        <MenuItem onClick={() => { if (actionEmployee) navigate(`/employees/${actionEmployee.id}`); closeActions() }}>View details</MenuItem>
        <MenuItem
          disabled={currentEmployee?.role === 'HR_MANAGER' && actionEmployee?.role === 'SUPER_ADMIN'}
          onClick={() => { if (actionEmployee) navigate(`/employees/${actionEmployee.id}/edit`); closeActions() }}
        >
          Edit employee
        </MenuItem>
        <MenuItem
          disabled={actionEmployee?.status === 'INACTIVE' || (currentEmployee?.role === 'HR_MANAGER' && actionEmployee?.role === 'SUPER_ADMIN')}
          onClick={() => void disableEmployee()}
        >
          Disable access
        </MenuItem>
        {currentEmployee?.role === 'SUPER_ADMIN' && (
          <MenuItem disabled={actionEmployee?.id === currentEmployee.id} onClick={() => void deleteEmployee()} sx={{ color: 'error.main' }}>
            Delete employee
          </MenuItem>
        )}
      </Menu>
    </Stack>
  )
}
