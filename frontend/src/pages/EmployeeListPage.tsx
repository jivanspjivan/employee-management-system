import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Pagination,
  Paper,
  MenuItem,
  Menu,
  IconButton,
  Select,
  Snackbar,
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
import { useLocation, useNavigate } from 'react-router-dom'

import { listDepartmentsRequest } from '../api/departments'
import { apiRequest } from '../api/client'
import { deleteEmployeeRequest, downloadEmployeeImportTemplateRequest, getEmployeeCsvJobRequest, listEmployeesRequest, startEmployeeExportJobRequest, startEmployeeImportJobRequest, updateEmployeeStatusRequest, type EmployeeCsvJob, type EmployeeListFilters } from '../api/employees'
import type { DepartmentSummary, EmployeeListItem, EmployeeRole, EmployeeStatus, PaginationMeta } from '../api/types'
import { useAuth } from '../auth'

const initialPagination: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 }

const roleLabel = (role: EmployeeListItem['role']) =>
  role.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )

const formatFileSize = (bytes: number) => bytes < 1024
  ? `${bytes} B`
  : bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

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

const csvCardHover = {
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
  '&:hover': {
    borderColor: '#b9cdbf',
    boxShadow: '0 9px 22px rgba(31,64,43,.09)',
    transform: 'translateY(-2px)',
  },
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
  const location = useLocation()
  const { employee: currentEmployee } = useAuth()
  const canManageEmployeeData = currentEmployee?.role === 'SUPER_ADMIN' || currentEmployee?.role === 'HR_MANAGER'
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [filters, setFilters] = useState<EmployeeListFilters>(() => {
    const state = location.state as { departmentId?: unknown } | null
    const queryParameters = new URLSearchParams(location.search)
    const queryDepartmentId = queryParameters.get('departmentId')
    const querySearch = queryParameters.get('search')
    if (queryDepartmentId || querySearch) return { departmentId: queryDepartmentId || undefined, search: querySearch || undefined }
    return typeof state?.departmentId === 'string' ? { departmentId: state.departmentId } : {}
  })
  const [csvMessage, setCsvMessage] = useState<string | null>(() => {
    const state = location.state as { message?: unknown } | null
    return typeof state?.message === 'string' ? state.message : null
  })
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvDialogMode, setCsvDialogMode] = useState<'IMPORT' | 'EXPORT' | null>(null)
  const [csvJob, setCsvJob] = useState<EmployeeCsvJob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const completedCsvJobRef = useRef<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null)
  const [actionEmployee, setActionEmployee] = useState<EmployeeListItem | null>(null)
  const [employeeSummary, setEmployeeSummary] = useState({ total: 0, active: 0, inactive: 0 })

  useEffect(() => {
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    const queryParameters = new URLSearchParams(location.search)
    const search = queryParameters.get('search') || undefined
    const departmentId = queryParameters.get('departmentId') || undefined
    if (search || departmentId) {
      setPage(1)
      setFilters((current) => ({ ...current, departmentId, search }))
    }
  }, [location.search])

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

  useEffect(() => {
    if (!csvJob || csvJob.status === 'COMPLETED' || csvJob.status === 'FAILED') return
    const timer = window.setInterval(() => {
      void getEmployeeCsvJobRequest(csvJob.id)
        .then(({ data }) => setCsvJob(data.job))
        .catch((requestError: unknown) => {
          setCsvError(requestError instanceof Error ? requestError.message : 'Unable to read CSV job progress')
          window.clearInterval(timer)
        })
    }, 600)
    return () => window.clearInterval(timer)
  }, [csvJob])

  useEffect(() => {
    if (!csvJob || csvJob.status !== 'COMPLETED' || completedCsvJobRef.current === csvJob.id) return
    completedCsvJobRef.current = csvJob.id
    if (csvJob.type === 'IMPORT') {
      setCsvMessage(`Import complete: ${csvJob.created} created, ${csvJob.updated} updated, ${csvJob.failed} failed.`)
      refreshList()
    }
  }, [csvJob])

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
    if (!canManageEmployeeData) return
    setCsvError(null)
    setCsvMessage(null)
    setCsvDialogMode('EXPORT')
    setCsvJob(null)
    try {
      const { data } = await startEmployeeExportJobRequest()
      setCsvJob(data.job)
    } catch (requestError) {
      setCsvError(requestError instanceof Error ? requestError.message : 'Unable to export employees')
      setCsvDialogMode(null)
    }
  }

  const importEmployees = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canManageEmployeeData) return
    const file = event.target.files?.[0]
    if (!file) return
    setCsvError(null)
    setCsvMessage(null)
    try {
      const { data } = await startEmployeeImportJobRequest(await file.text())
      setCsvJob(data.job)
    } catch (importError) {
      setCsvError(importError instanceof Error ? importError.message : 'Unable to import employees')
      setCsvDialogMode(null)
    }
    event.target.value = ''
  }

  const downloadCsvTemplate = async () => {
    if (!canManageEmployeeData) return
    try {
      await downloadEmployeeImportTemplateRequest()
    } catch (requestError) {
      setCsvError(requestError instanceof Error ? requestError.message : 'Unable to download CSV template')
    }
  }

  const downloadCompletedExport = () => {
    if (!csvJob?.csv) return
    const url = URL.createObjectURL(new Blob([csvJob.csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = csvJob.fileName ?? 'playstack-employees.csv'
    link.click()
    URL.revokeObjectURL(url)
    setCsvMessage(`Exported ${csvJob.total} employees.`)
  }

  const downloadImportReport = () => {
    if (!csvJob || csvJob.type !== 'IMPORT') return
    const reportRows = [
      'metric,value',
      `processed,${csvJob.processed}`,
      `created,${csvJob.created}`,
      `updated,${csvJob.updated}`,
      `failed,${csvJob.failed}`,
      '',
      'error',
      ...csvJob.errors.map((error) => `"${error.replaceAll('"', '""')}"`),
    ]
    const url = URL.createObjectURL(new Blob([reportRows.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `playstack-import-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const csvJobWorking = (csvDialogMode === 'EXPORT' && !csvJob) || csvJob?.status === 'QUEUED' || csvJob?.status === 'PROCESSING'
  const csvJobCompleted = csvJob?.status === 'COMPLETED'
  const csvDialogTitle = !csvJob
    ? csvDialogMode === 'IMPORT' ? 'Import employees' : 'Export employees'
    : csvJob.status === 'COMPLETED'
      ? `${csvJob.type === 'IMPORT' ? 'Import' : 'Export'} completed`
      : csvJob.status === 'FAILED'
        ? `${csvJob.type === 'IMPORT' ? 'Import' : 'Export'} failed`
        : `${csvJob.type === 'IMPORT' ? 'Importing' : 'Exporting'} employees`

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
            {canManageEmployeeData && <><Button disabled={csvJobWorking} onClick={() => void exportEmployees()} size="small" startIcon={<SvgIcon sx={{ fontSize: 18 }}><path d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z" /></SvgIcon>} sx={{ fontSize: '0.75rem', minHeight: 34, px: 1.4 }} variant="outlined">Export CSV</Button>
            <Button disabled={csvJobWorking} onClick={() => { setCsvJob(null); setCsvDialogMode('IMPORT') }} size="small" startIcon={<SvgIcon sx={{ fontSize: 18 }}><path d="M5 17h14v2H5v-2Zm7-14 7 7h-4v5H9v-5H5l7-7Z" /></SvgIcon>} sx={{ fontSize: '0.75rem', minHeight: 34, px: 1.4 }} variant="outlined">Import bulk</Button>
            <input accept=".csv,text/csv" hidden onChange={(event) => void importEmployees(event)} ref={fileInputRef} type="file" />
            <Button onClick={() => navigate('/employees/new')} size="small" startIcon={<AddEmployeeIcon />} sx={{ fontSize: '0.75rem', minHeight: 34, px: 1.5 }} variant="contained">Add employee</Button></>}
          </Stack>
        </Stack>
      </Box>

      <Dialog fullWidth maxWidth="sm" onClose={() => { if (!csvJobWorking) setCsvDialogMode(null) }} open={canManageEmployeeData && Boolean(csvDialogMode)} slotProps={{ backdrop: { sx: { backdropFilter: 'blur(3px)', bgcolor: 'rgba(20,34,25,.34)' } }, paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ pb: 1 }}><Typography sx={{ fontSize: '1.08rem', fontWeight: 760 }}>{csvDialogTitle}</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .25 }}>{csvJob ? csvJobCompleted ? `${csvJob.type === 'IMPORT' ? 'Employee records were processed' : 'Your employee export is ready to download'}.` : `${csvJob.type === 'IMPORT' ? 'Importing employee records' : 'Preparing employee data'} safely in the background.` : 'Start with the Playstack template or upload a completed CSV file.'}</Typography></DialogTitle>
        <DialogContent>
          {csvDialogMode === 'IMPORT' && !csvJob ? (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ bgcolor: '#f3f8f4', border: '1px solid #dce7df', borderRadius: 2.5, mb: 1.5, overflow: 'hidden', px: { xs: 1.5, sm: 2 }, py: 1.4 }}><Box sx={{ display: 'grid', gap: { xs: 1.2, sm: 3 }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, position: 'relative' }}>{[{ number: 1, title: 'Download the template', detail: 'Start with the correct employee columns', optional: true }, { number: 2, title: 'Upload your CSV', detail: 'We will create or update each employee', optional: false }].map((step) => <Stack direction="row" key={step.number} spacing={1.1} sx={{ alignItems: 'center', minWidth: 0, position: 'relative', zIndex: 1 }}><Box sx={{ alignItems: 'center', bgcolor: step.number === 2 ? 'primary.main' : '#fff', border: `1px solid ${step.number === 2 ? '#2f7045' : '#b9cdbf'}`, borderRadius: '50%', boxShadow: '0 3px 8px rgba(31,64,43,.08)', color: step.number === 2 ? '#fff' : 'primary.main', display: 'flex', flexShrink: 0, fontSize: '.72rem', fontWeight: 800, height: 36, justifyContent: 'center', width: 36 }}>{step.number}</Box><Box sx={{ minWidth: 0 }}><Stack direction="row" spacing={.65} sx={{ alignItems: 'center' }}><Typography noWrap sx={{ color: '#344c3b', fontSize: '.72rem', fontWeight: 750 }}>{step.title}</Typography>{step.optional && <Chip label="Optional" size="small" sx={{ bgcolor: '#e5ede7', color: '#62736a', fontSize: '.52rem', fontWeight: 700, height: 18 }} />}</Stack><Typography color="text.secondary" noWrap sx={{ fontSize: '.61rem', mt: .18 }}>{step.detail}</Typography></Box></Stack>)}</Box></Box>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' } }}>
              <Paper elevation={0} sx={{ ...csvCardHover, bgcolor: '#f7faf8', border: '1px solid #dce6df', borderRadius: 2.5, display: 'flex', flexDirection: 'column', p: 2.2 }}><Box sx={{ bgcolor: '#e6f1e9', borderRadius: 2.25, color: 'primary.main', display: 'grid', height: 50, mb: 1.3, placeItems: 'center', width: 50 }}><SvgIcon sx={{ fontSize: 28 }}><path d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z" /></SvgIcon></Box><Typography sx={{ fontSize: '.86rem', fontWeight: 720 }}>Download template</Typography><Typography color="text.secondary" sx={{ fontSize: '.7rem', lineHeight: 1.55, mt: .45 }}>Use the required columns and example row as your starting point.</Typography><Button fullWidth onClick={downloadCsvTemplate} size="small" sx={{ mt: 'auto', pt: 1.5 }} variant="outlined">Download template</Button></Paper>
              <Paper elevation={0} sx={{ ...csvCardHover, bgcolor: '#f7faf8', border: '1px solid #dce6df', borderRadius: 2.5, display: 'flex', flexDirection: 'column', p: 2.2 }}><Box sx={{ bgcolor: '#e6f1e9', borderRadius: 2.25, color: 'primary.main', display: 'grid', height: 50, mb: 1.3, placeItems: 'center', width: 50 }}><SvgIcon sx={{ fontSize: 28 }}><path d="M5 17h14v2H5v-2Zm7-14 7 7h-4v5H9v-5H5l7-7Z" /></SvgIcon></Box><Typography sx={{ fontSize: '.86rem', fontWeight: 720 }}>Upload employee CSV</Typography><Typography color="text.secondary" sx={{ fontSize: '.7rem', lineHeight: 1.55, mt: .45 }}>New employees are created; matching employee IDs or emails are updated.</Typography><Button fullWidth onClick={() => fileInputRef.current?.click()} size="small" sx={{ mt: 'auto', pt: 1.5 }} variant="contained">Choose CSV file</Button></Paper>
              </Box>
            </Box>
          ) : csvJob ? (
            <Box sx={{ mt: 1 }}>
              <Paper elevation={0} sx={{ ...csvCardHover, background: 'linear-gradient(135deg,#f3f8f4,#fbfcfb)', border: '1px solid #dce6df', borderRadius: 2.5, p: 2.2 }}>
                {csvJobCompleted ? <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: '#dff1e5', borderRadius: '50%', color: '#2f7d4a', display: 'flex', height: 48, justifyContent: 'center', width: 48 }}><SvgIcon sx={{ fontSize: 27 }}><path d="m9 16.17-3.88-3.88L3.7 13.7 9 19 21 7l-1.41-1.41z" /></SvgIcon></Box><Box sx={{ flex: 1 }}><Typography sx={{ color: '#285f3c', fontSize: '.94rem', fontWeight: 760 }}>{csvJob.type === 'IMPORT' ? 'Employees imported successfully' : 'Employee export is ready'}</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .25 }}>{csvJob.processed} records processed</Typography></Box><Chip label="Completed" size="small" sx={{ bgcolor: '#e4f2e8', color: '#34754a', fontSize: '.67rem', fontWeight: 750, height: 25 }} /></Stack> : <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}><Box><Typography sx={{ color: csvJob.status === 'FAILED' ? '#b63e3e' : 'primary.main', fontSize: '2rem', fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1 }}>{csvJob.progress}%</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .45 }}>{csvJob.status === 'QUEUED' ? 'Waiting to start' : csvJob.status === 'PROCESSING' ? 'Processing records' : 'Job failed'}</Typography></Box><Typography color="text.secondary" sx={{ fontSize: '.7rem' }}>{csvJob.processed} of {csvJob.total || '—'} processed</Typography></Stack>}
                {!csvJobCompleted && <LinearProgress color={csvJob.status === 'FAILED' ? 'error' : 'primary'} sx={{ bgcolor: '#dce8df', borderRadius: 10, height: 14, mt: 1.8, overflow: 'hidden', '& .MuiLinearProgress-bar': { borderRadius: 10, transition: 'transform 480ms cubic-bezier(.2,.7,.3,1)' } }} value={csvJob.progress} variant="determinate" />}
              </Paper>
              {csvJobCompleted && csvJob.type === 'EXPORT' && csvJob.csv && <Paper elevation={0} sx={{ ...csvCardHover, border: '1px solid #dfe7e1', borderRadius: 2.25, mt: 1.5, p: 1.5 }}><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: '#e8f2eb', borderRadius: 2, color: '#39744c', display: 'flex', height: 42, justifyContent: 'center', width: 42 }}><SvgIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 9H15ZM8 13h8v1.5H8V13Zm0 3h8v1.5H8V16Zm0-6h4v1.5H8V10Z" /></SvgIcon></Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontSize: '.8rem', fontWeight: 720 }}>{csvJob.fileName ?? 'playstack-employees.csv'}</Typography><Stack direction="row" spacing={.7} sx={{ alignItems: 'center', mt: .25 }}><Typography color="text.secondary" sx={{ fontSize: '.65rem' }}>{formatFileSize(new Blob([csvJob.csv]).size)}</Typography><Box sx={{ bgcolor: '#aebbb2', borderRadius: '50%', height: 3, width: 3 }} /><Typography color="text.secondary" sx={{ fontSize: '.65rem' }}>Generated now</Typography></Stack></Box><Chip label="CSV" size="small" sx={{ bgcolor: '#f0f4f1', color: '#5b6d61', fontSize: '.59rem', fontWeight: 720, height: 22 }} /></Stack></Paper>}
              {csvJob.type === 'IMPORT' && <Box sx={{ mt: 1.5 }}><Typography sx={{ fontSize: '.72rem', fontWeight: 730, mb: .7 }}>Import report</Typography><Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3,1fr)' }}>{[{ label: 'Created', value: csvJob.created, color: '#34784b' }, { label: 'Updated', value: csvJob.updated, color: '#3f6f9d' }, { label: 'Failed', value: csvJob.failed, color: '#b64242' }].map((item) => <Paper elevation={0} key={item.label} sx={{ ...csvCardHover, border: '1px solid #e3e9e4', borderRadius: 2, p: 1.25, textAlign: 'center' }}><Typography sx={{ color: item.color, fontSize: '1.1rem', fontWeight: 780 }}>{item.value}</Typography><Typography color="text.secondary" sx={{ fontSize: '.62rem' }}>{item.label}</Typography></Paper>)}</Box></Box>}
              {(csvJob.error || csvJob.errors.length > 0) && <Alert severity="error" sx={{ mt: 1.5 }}>{csvJob.error ?? csvJob.errors.slice(0, 3).join(' · ')}</Alert>}
            </Box>
          ) : <Paper elevation={0} sx={{ background: 'linear-gradient(135deg,#f3f8f4,#fbfcfb)', border: '1px solid #dce6df', borderRadius: 2.5, mt: 1, p: 2.2 }}><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: '#e5f0e8', borderRadius: 2, color: 'primary.main', display: 'flex', height: 40, justifyContent: 'center', width: 40 }}><SvgIcon><path d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z" /></SvgIcon></Box><Box><Typography sx={{ fontSize: '.86rem', fontWeight: 730 }}>Starting employee export…</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .25 }}>Creating a secure background job for your CSV file.</Typography></Box></Stack><LinearProgress sx={{ borderRadius: 10, height: 8, mt: 1.7, overflow: 'hidden', '& .MuiLinearProgress-bar': { borderRadius: 10 } }} /></Paper>}
        </DialogContent>
        {!csvJobWorking && <DialogActions sx={{ bgcolor: '#fafcfb', borderTop: '1px solid #e7ece8', px: 3, py: 1.7 }}>{csvJobCompleted && csvJob?.type === 'EXPORT' && <Button onClick={downloadCompletedExport} startIcon={<SvgIcon><path d="M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z" /></SvgIcon>} sx={{ boxShadow: '0 5px 13px rgba(47,112,69,.18)', transition: 'box-shadow 180ms ease, transform 180ms ease', '&:hover': { boxShadow: '0 9px 20px rgba(47,112,69,.28)', transform: 'translateY(-2px)' } }} variant="contained">Download CSV</Button>}{csvJobCompleted && csvJob?.type === 'IMPORT' && <Button onClick={downloadImportReport} startIcon={<SvgIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 9H15v-5.5L19.5 9ZM8 13h8v1.5H8V13Zm0 3h8v1.5H8V16Z" /></SvgIcon>} variant="outlined">Download report</Button>}<Button onClick={() => setCsvDialogMode(null)} sx={{ transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease', '&:hover': { bgcolor: csvJobCompleted && csvJob?.type !== 'EXPORT' ? undefined : '#f3f7f4', borderColor: '#9fb5a6', boxShadow: '0 5px 12px rgba(31,64,43,.09)', transform: 'translateY(-2px)' } }} variant={csvJobCompleted && csvJob?.type !== 'EXPORT' ? 'contained' : 'outlined'}>{!csvJob ? 'Cancel' : 'Close'}</Button></DialogActions>}
      </Dialog>

      {error && <Alert severity="error">{error}</Alert>}
      <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setCsvMessage(null)} open={Boolean(csvMessage)}>
        <Alert elevation={6} onClose={() => setCsvMessage(null)} severity="success" variant="filled">{csvMessage}</Alert>
      </Snackbar>
      <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setCsvError(null)} open={Boolean(csvError)}>
        <Alert elevation={6} onClose={() => setCsvError(null)} severity="error" variant="filled">{csvError}</Alert>
      </Snackbar>

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
                overscrollBehavior: 'contain',
                overflowX: 'auto',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
                scrollbarColor: '#c5d0c9 transparent',
                scrollbarGutter: 'stable',
                scrollbarWidth: 'thin',
                touchAction: 'pan-x pan-y',
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': { height: 7, width: 7 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#c5d0c9', border: '2px solid transparent', borderRadius: 8, backgroundClip: 'padding-box' },
                '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#9fb0a5' },
              }}
            >
              <Table aria-label="Employee list" stickyHeader sx={{ minWidth: 1460, tableLayout: 'fixed' }}>
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
