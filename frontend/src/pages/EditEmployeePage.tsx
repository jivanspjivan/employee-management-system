import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Alert, Box, Button, CircularProgress, FormControl, FormHelperText, InputLabel, MenuItem,
  Paper, Select, Skeleton, Snackbar, Stack, SvgIcon, TextField, Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import { listDepartmentsRequest } from '../api/departments'
import {
  assignEmployeeManagerRequest, getEmployeeRequest, listEmployeesRequest, updateEmployeeRequest,
  type UpdateEmployeeInput,
} from '../api/employees'
import type { DepartmentSummary, EmployeeListItem, EmployeeRole, EmployeeStatus } from '../api/types'
import { useAuth } from '../auth'

type Values = Record<keyof UpdateEmployeeInput | 'employeeId' | 'reportingManagerId', string>
type Errors = Partial<Record<keyof Values, string>>

const emptyValues: Values = {
  departmentId: '', designation: '', email: '', employeeId: '', joiningDate: '', name: '', phone: '',
  profileImageUrl: '', reportingManagerId: '', role: 'EMPLOYEE', salary: '', status: 'ACTIVE',
}

const inputSx = {
  '& .MuiInputLabel-root': { color: '#536159', fontWeight: 500 },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fdfefd', height: 50,
    '& fieldset': { borderColor: '#e3e9e4' }, '&:hover fieldset': { borderColor: '#cbd6cd' },
    '&.Mui-focused': { backgroundColor: '#fff', boxShadow: '0 0 0 3px rgba(47,112,69,0.08)' },
    '&.Mui-focused fieldset': { borderColor: '#3f8156', borderWidth: '1.5px' },
  },
}

const cardSx = {
  backgroundColor: '#fff', border: '1px solid #dde6df', borderRadius: 2.5,
  boxShadow: '0 12px 30px rgba(28,61,39,0.1), 0 2px 6px rgba(28,61,39,0.04)', overflow: 'hidden',
}

const headingSx = {
  background: 'linear-gradient(90deg, #e9f1eb 0%, #f2f6f3 100%)',
  borderBottom: '1px solid #d6e1d8', px: { xs: 2, md: 3 }, py: 1.8,
}

const BackIcon = () => <SvgIcon fontSize="small"><path d="m20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2Z" /></SvgIcon>
const SaveIcon = () => <SvgIcon fontSize="small"><path d="M17 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v4Z" /></SvgIcon>
const SectionIcon = ({ work = false }: { work?: boolean }) => <Box sx={{ alignItems: 'center', bgcolor: '#dcebe0', borderRadius: 1.5, color: '#2f7045', display: 'flex', height: 34, justifyContent: 'center', width: 34 }}><SvgIcon sx={{ fontSize: 19 }}><path d={work ? 'M20 6h-4V4c0-1.11-.89-2-2-2h-4C8.89 2 8 2.89 8 4v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2Zm-6 0h-4V4h4v2Z' : 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z'} /></SvgIcon></Box>

const validate = (values: Values): Errors => {
  if (!values.employeeId.trim()) return { employeeId: 'Please enter the employee ID' }
  if (!values.name.trim()) return { name: 'Please enter the employee name' }
  if (!values.email.trim()) return { email: 'Please enter the work email' }
  if (!/^\S+@\S+\.\S+$/.test(values.email)) return { email: 'Enter a valid email address' }
  if (values.phone && !/^\+?[0-9 ()-]{7,20}$/.test(values.phone)) return { phone: 'Enter a valid phone number' }
  if (!values.departmentId) return { departmentId: 'Please select a department' }
  if (!values.designation.trim()) return { designation: 'Please enter a designation' }
  if (values.salary === '' || Number(values.salary) < 0) return { salary: 'Please enter a valid annual salary' }
  if (!values.joiningDate) return { joiningDate: 'Please select a joining date' }
  if (values.profileImageUrl) {
    try { new URL(values.profileImageUrl) } catch { return { profileImageUrl: 'Enter a valid image URL' } }
  }
  return {}
}

export const EditEmployeePage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { employee: currentEmployee } = useAuth()
  const [values, setValues] = useState(emptyValues)
  const [originalManagerId, setOriginalManagerId] = useState('')
  const [target, setTarget] = useState<EmployeeListItem | null>(null)
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [managers, setManagers] = useState<EmployeeListItem[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getEmployeeRequest(id, controller.signal), listDepartmentsRequest(controller.signal),
      listEmployeesRequest(1, 100, { status: 'ACTIVE' }, controller.signal),
    ]).then(([employeeResponse, departmentResponse, managerResponse]) => {
      const employee = employeeResponse.data.employee
      const managerId = employee.reportingManagerId ?? ''
      const eligibleManagers = managerResponse.data.employees.filter((manager) => manager.id !== employee.id && (manager.role === 'SUPER_ADMIN' || manager.role === 'HR_MANAGER'))
      const eligibleManagerId = eligibleManagers.some((manager) => manager.id === managerId) ? managerId : ''
      setTarget(employee)
      setOriginalManagerId(managerId)
      setValues({
        departmentId: employee.departmentId, designation: employee.designation, email: employee.email,
        employeeId: employee.employeeId, joiningDate: employee.joiningDate.slice(0, 10), name: employee.name,
        phone: employee.phone ?? '', profileImageUrl: employee.profileImageUrl ?? '', reportingManagerId: eligibleManagerId,
        role: employee.role, salary: employee.salary, status: employee.status,
      })
      setDepartments(departmentResponse.data.departments)
      setManagers(eligibleManagers)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load employee')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [id])

  const blocked = currentEmployee?.role === 'HR_MANAGER' && target?.role === 'SUPER_ADMIN'
  const roles = useMemo<EmployeeRole[]>(() => currentEmployee?.role === 'SUPER_ADMIN' ? ['EMPLOYEE', 'HR_MANAGER', 'SUPER_ADMIN'] : ['EMPLOYEE', 'HR_MANAGER'], [currentEmployee?.role])
  const editingSelf = currentEmployee?.id === target?.id
  const change = (field: keyof Values, value: string) => { setValues((current) => ({ ...current, [field]: value, ...(field === 'role' ? { reportingManagerId: '' } : {}) })); setErrors({}) }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    const firstError = Object.entries(nextErrors)[0] as [keyof Values, string] | undefined
    if (firstError) {
      setErrors(nextErrors); setToast(firstError[1]); window.setTimeout(() => document.getElementById(firstError[0])?.focus(), 0); return
    }
    setSaving(true); setToast(null)
    try {
      await updateEmployeeRequest(id, {
        departmentId: values.departmentId, designation: values.designation.trim(), email: values.email.trim().toLowerCase(),
        joiningDate: values.joiningDate, name: values.name.trim(),
        phone: values.phone.trim() || undefined, profileImageUrl: values.profileImageUrl.trim() || undefined,
        role: values.role as EmployeeRole, salary: Number(values.salary), status: values.status as EmployeeStatus,
      })
      if (values.reportingManagerId !== originalManagerId) await assignEmployeeManagerRequest(id, values.reportingManagerId || null)
      navigate('/employees', { replace: true, state: { message: `${values.name.trim()} was updated successfully.` } })
    } catch (error) {
      setToast(error instanceof ApiError ? error.message : 'Unable to update employee')
    } finally { setSaving(false) }
  }

  const input = (field: keyof Values, label: string, props: Record<string, unknown> = {}) => <TextField disabled={blocked || field === 'employeeId'} error={Boolean(errors[field])} fullWidth helperText={field === 'employeeId' ? 'Employee ID cannot be changed after creation' : errors[field]} id={field} label={label} onChange={(event) => change(field, event.target.value)} sx={inputSx} value={values[field]} {...props} />
  const select = (field: keyof Values, label: string, items: ReactNode) => <FormControl disabled={blocked || (field === 'role' && editingSelf)} error={Boolean(errors[field])} fullWidth sx={inputSx}><InputLabel id={`${field}-label`}>{label}</InputLabel><Select id={field} label={label} labelId={`${field}-label`} onChange={(event) => change(field, event.target.value)} value={values[field]}>{items}</Select>{field === 'role' && editingSelf ? <FormHelperText>You cannot change your own role</FormHelperText> : errors[field] && <FormHelperText>{errors[field]}</FormHelperText>}</FormControl>
  const heading = (title: string, description: string, work = false) => <Box sx={headingSx}><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><SectionIcon work={work} /><Box><Typography sx={{ color: '#233b2b', fontWeight: 750 }}>{title}</Typography><Typography color="#617068" variant="body2">{description}</Typography></Box></Stack></Box>

  if (loading) return <Stack spacing={2.5}><Skeleton height={70} width={330} /><Skeleton height={300} variant="rounded" /><Skeleton height={300} variant="rounded" /></Stack>
  if (loadError) return <Alert action={<Button onClick={() => navigate('/employees')}>Back</Button>} severity="error">{loadError}</Alert>

  return <Stack component="form" onSubmit={submit} spacing={2.5} sx={{ mt: { md: -2.5 } }}>
    <Box><Button color="inherit" onClick={() => navigate('/employees')} size="small" startIcon={<BackIcon />} sx={{ color: '#748078', fontSize: '0.74rem', px: 0.25 }} variant="text">Back to employees</Button><Typography component="h1" sx={{ fontSize: { xs: 25, md: 29 }, fontWeight: 750, letterSpacing: '-0.03em', mt: 0.4 }}>Edit employee</Typography><Typography color="text.secondary">Update {target?.name}’s employee profile and workplace access.</Typography></Box>
    {blocked && <Alert severity="warning">HR Managers cannot modify a Super Admin account.</Alert>}
    <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setToast(null)} open={Boolean(toast)}><Alert elevation={6} onClose={() => setToast(null)} severity="error" variant="filled">{toast}</Alert></Snackbar>
    <Paper elevation={0} sx={cardSx}>{heading('Basic information', 'Personal and contact details used across the employee directory.')}<Box sx={{ display: 'grid', gap: 2.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, p: { xs: 2, md: 3 } }}>{input('employeeId', 'Employee ID *')}{input('name', 'Full name *')}{input('email', 'Work email *', { type: 'email' })}{input('phone', 'Phone number')}{input('profileImageUrl', 'Profile image URL', { sx: { ...inputSx, gridColumn: { md: '1 / -1' } } })}</Box></Paper>
    <Paper elevation={0} sx={cardSx}>{heading('Employment details', 'Update team, access level, status, and reporting structure.', true)}<Box sx={{ display: 'grid', gap: 2.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, p: { xs: 2, md: 3 } }}>{select('departmentId', 'Department *', departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>))}{input('designation', 'Designation *')}{input('salary', 'Annual salary (₹) *', { inputProps: { min: 0 }, type: 'number' })}{input('joiningDate', 'Joining date *', { InputLabelProps: { shrink: true }, type: 'date' })}{select('role', 'Role *', roles.map((role) => <MenuItem key={role} value={role}>{role.replaceAll('_', ' ')}</MenuItem>))}{select('status', 'Status *', [<MenuItem key="ACTIVE" value="ACTIVE">Active</MenuItem>, <MenuItem key="INACTIVE" value="INACTIVE">Inactive</MenuItem>])}<Box sx={{ gridColumn: { md: '1 / -1' } }}>{select('reportingManagerId', 'Reporting manager', [<MenuItem key="none" value=""><em>No reporting manager</em></MenuItem>, ...managers.map((manager) => <MenuItem key={manager.id} value={manager.id}>{manager.name} · {manager.role === 'SUPER_ADMIN' ? 'Super Admin' : 'HR Manager'}</MenuItem>)])}<FormHelperText>Only an active HR Manager or Super Admin can be selected.</FormHelperText></Box></Box></Paper>
    <Paper elevation={0} sx={{ alignItems: 'center', bgcolor: 'rgba(255,255,255,.94)', border: '1px solid #dce5de', borderRadius: 2.5, bottom: 12, boxShadow: '0 8px 22px rgba(25,60,37,.09)', display: 'flex', justifyContent: 'flex-end', p: 1.5, position: 'sticky', zIndex: 2 }}><Button onClick={() => navigate('/employees')} sx={{ mr: 1 }}>Cancel</Button><Button disabled={blocked || saving} startIcon={saving ? <CircularProgress color="inherit" size={17} /> : <SaveIcon />} sx={{ boxShadow: '0 7px 16px rgba(47,112,69,.24)', fontWeight: 700, minHeight: 44, px: 2.6 }} type="submit" variant="contained">{saving ? 'Saving changes…' : 'Save changes'}</Button></Paper>
  </Stack>
}
