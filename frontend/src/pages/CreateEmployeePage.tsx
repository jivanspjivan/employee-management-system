import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { listDepartmentsRequest } from '../api/departments'
import { createEmployeeRequest, listEmployeesRequest, type CreateEmployeeInput } from '../api/employees'
import type { DepartmentSummary, EmployeeListItem, EmployeeRole, EmployeeStatus } from '../api/types'
import { useAuth } from '../auth'

type FormValues = Record<keyof CreateEmployeeInput, string>
type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  departmentId: '', designation: '', email: '', employeeId: '', joiningDate: new Date().toISOString().slice(0, 10),
  name: '', password: '', phone: '', profileImageUrl: '', reportingManagerId: '', role: 'EMPLOYEE', salary: '', status: 'ACTIVE',
}

const fieldSx = {
  '& .MuiInputLabel-root': { color: '#536159', fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fdfefd',
    height: 50,
    '& fieldset': { borderColor: '#e3e9e4', borderWidth: '1px' },
    '&:hover fieldset': { borderColor: '#cbd6cd' },
    '&.Mui-focused': { backgroundColor: '#fff', boxShadow: '0 0 0 3px rgba(47,112,69,0.08)' },
    '&.Mui-focused fieldset': { borderColor: '#3f8156', borderWidth: '1.5px' },
  },
}

const sectionSx = {
  backgroundColor: '#fff',
  border: '1px solid #dde6df',
  borderRadius: 2.5,
  boxShadow: '0 12px 30px rgba(28, 61, 39, 0.1), 0 2px 6px rgba(28, 61, 39, 0.04)',
  overflow: 'hidden',
}

const sectionHeadingSx = {
  background: 'linear-gradient(90deg, #e9f1eb 0%, #f2f6f3 100%)',
  borderBottom: '1px solid #d6e1d8',
  px: { xs: 2, md: 3 },
  py: 1.8,
}

const BackIcon = () => <SvgIcon fontSize="small"><path d="m20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2Z" /></SvgIcon>
const SaveIcon = () => <SvgIcon fontSize="small"><path d="M17 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v4Z" /></SvgIcon>
const SectionIcon = ({ type }: { type: 'person' | 'work' }) => (
  <Box sx={{ alignItems: 'center', backgroundColor: '#dcebe0', borderRadius: 1.5, color: '#2f7045', display: 'flex', height: 34, justifyContent: 'center', width: 34 }}>
    <SvgIcon sx={{ fontSize: 19 }}><path d={type === 'person' ? 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z' : 'M20 6h-4V4c0-1.11-.89-2-2-2h-4C8.89 2 8 2.89 8 4v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2Zm-6 0h-4V4h4v2Z'} /></SvgIcon>
  </Box>
)

const validate = (values: FormValues) => {
  const errors: FormErrors = {}
  if (!values.employeeId.trim()) errors.employeeId = 'Please enter the employee ID'
  else if (values.employeeId.trim().length < 2) errors.employeeId = 'Enter a valid employee ID'
  if (!values.name.trim()) errors.name = 'Please enter the employee name'
  else if (values.name.trim().length < 2) errors.name = 'Enter a valid employee name'
  if (!values.email.trim()) errors.email = 'Please enter the work email'
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address'
  if (values.phone && !/^\+?[0-9 ()-]{7,20}$/.test(values.phone)) errors.phone = 'Enter a valid phone number'
  if (!values.password) errors.password = 'Please enter a temporary password'
  else if (values.password.length < 8) errors.password = 'Password must contain at least 8 characters'
  if (!values.departmentId) errors.departmentId = 'Please select a department'
  if (!values.designation.trim()) errors.designation = 'Please enter a designation'
  else if (values.designation.trim().length < 2) errors.designation = 'Enter a valid designation'
  if (values.salary === '') errors.salary = 'Please enter the annual salary'
  else if (Number(values.salary) < 0) errors.salary = 'Enter a valid salary'
  if (!values.joiningDate) errors.joiningDate = 'Please select a joining date'
  if (values.profileImageUrl) {
    try { new URL(values.profileImageUrl) } catch { errors.profileImageUrl = 'Enter a valid image URL' }
  }
  return errors
}

export const CreateEmployeePage = () => {
  const navigate = useNavigate()
  const { employee: currentEmployee } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [managers, setManagers] = useState<EmployeeListItem[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; severity: 'error' | 'success' } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      listDepartmentsRequest(controller.signal),
      listEmployeesRequest(1, 100, { status: 'ACTIVE' }, controller.signal),
    ]).then(([departmentResponse, employeeResponse]) => {
      setDepartments(departmentResponse.data.departments)
      setManagers(employeeResponse.data.employees)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setOptionsError(error instanceof Error ? error.message : 'Unable to load form options')
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingOptions(false)
    })
    return () => controller.abort()
  }, [])

  const roles = useMemo<EmployeeRole[]>(
    () => currentEmployee?.role === 'SUPER_ADMIN' ? ['EMPLOYEE', 'HR_MANAGER', 'SUPER_ADMIN'] : ['EMPLOYEE', 'HR_MANAGER'],
    [currentEmployee?.role],
  )

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    const firstError = Object.entries(nextErrors)[0] as [keyof FormValues, string] | undefined
    if (firstError) {
      const [field, message] = firstError
      setErrors({ [field]: message })
      setToast({ message, severity: 'error' })
      window.setTimeout(() => document.getElementById(field)?.focus(), 0)
      return
    }
    setSubmitting(true)
    setToast(null)
    try {
      await createEmployeeRequest({
        employeeId: values.employeeId.trim(), name: values.name.trim(), email: values.email.trim().toLowerCase(),
        password: values.password, phone: values.phone.trim() || undefined, departmentId: values.departmentId,
        designation: values.designation.trim(), salary: Number(values.salary), joiningDate: values.joiningDate,
        status: values.status as EmployeeStatus, role: values.role as EmployeeRole,
        reportingManagerId: values.reportingManagerId || undefined, profileImageUrl: values.profileImageUrl.trim() || undefined,
      })
      navigate('/employees', { replace: true, state: { message: `${values.name.trim()} was added successfully.` } })
    } catch (error) {
      setToast({ message: error instanceof ApiError ? error.message : 'Unable to create employee', severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const input = (field: keyof FormValues, label: string, props: Record<string, unknown> = {}) => (
    <TextField
      error={Boolean(errors[field])} fullWidth helperText={errors[field]} id={field} label={label}
      onChange={(event) => updateValue(field, event.target.value)} sx={fieldSx} value={values[field]} {...props}
    />
  )

  const select = (field: keyof FormValues, label: string, children: React.ReactNode) => (
    <FormControl error={Boolean(errors[field])} fullWidth sx={fieldSx}>
      <InputLabel id={`${field}-label`}>{label}</InputLabel>
      <Select id={field} label={label} labelId={`${field}-label`} onChange={(event) => updateValue(field, event.target.value)} value={values[field]}>{children}</Select>
      {errors[field] && <FormHelperText>{errors[field]}</FormHelperText>}
    </FormControl>
  )

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2.5} sx={{ mt: { md: -2.5 } }}>
      <Box>
        <Button color="inherit" onClick={() => navigate('/employees')} size="small" startIcon={<BackIcon />} sx={{ color: '#748078', fontSize: '0.74rem', fontWeight: 500, mb: 0.45, minHeight: 26, px: 0.25, '& .MuiButton-startIcon': { mr: 0.4 }, '&:hover': { backgroundColor: 'transparent', color: '#3f5948' } }} variant="text">Back to employees</Button>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 25, md: 29 }, fontWeight: 750, letterSpacing: '-0.03em' }}>Add employee</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.35 }}>Create a Playstack employee profile and assign workplace access.</Typography>
        </Box>
      </Box>

      {optionsError && <Alert severity="error">{optionsError}</Alert>}

      <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setToast(null)} open={Boolean(toast)}>
        <Alert elevation={6} onClose={() => setToast(null)} severity={toast?.severity ?? 'error'} variant="filled">{toast?.message}</Alert>
      </Snackbar>

      <Paper elevation={0} sx={sectionSx}>
        <Box sx={sectionHeadingSx}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <SectionIcon type="person" />
            <Box>
              <Typography sx={{ color: '#233b2b', fontSize: '0.98rem', fontWeight: 750 }}>Basic information</Typography>
              <Typography color="#617068" variant="body2">Personal and contact details used across the employee directory.</Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ display: 'grid', gap: 2.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, p: { xs: 2, md: 3 } }}>
          {input('employeeId', 'Employee ID *', { placeholder: 'PS-BLR-1101' })}
          {input('name', 'Full name *', { placeholder: 'Mahesh Kulkarni' })}
          {input('email', 'Work email *', { type: 'email', placeholder: 'mahesh@playstack.com' })}
          {input('phone', 'Phone number', { placeholder: '+91 98765 43210' })}
          {input('password', 'Temporary password *', { autoComplete: 'new-password', type: 'password' })}
          {input('profileImageUrl', 'Profile image URL', { placeholder: 'https://...' })}
        </Box>
      </Paper>

      <Paper elevation={0} sx={sectionSx}>
        <Box sx={sectionHeadingSx}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <SectionIcon type="work" />
            <Box>
              <Typography sx={{ color: '#233b2b', fontSize: '0.98rem', fontWeight: 750 }}>Employment details</Typography>
              <Typography color="#617068" variant="body2">Set the employee’s team, access level, and reporting structure.</Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ display: 'grid', gap: 2.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, p: { xs: 2, md: 3 } }}>
          {select('departmentId', 'Department *', departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>))}
          {input('designation', 'Designation *', { placeholder: 'Senior Software Engineer' })}
          {input('salary', 'Annual salary (₹) *', { inputProps: { min: 0 }, type: 'number' })}
          {input('joiningDate', 'Joining date *', { InputLabelProps: { shrink: true }, type: 'date' })}
          {select('role', 'Role *', roles.map((role) => <MenuItem key={role} value={role}>{role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}</MenuItem>))}
          {select('status', 'Status *', [<MenuItem key="ACTIVE" value="ACTIVE">Active</MenuItem>, <MenuItem key="INACTIVE" value="INACTIVE">Inactive</MenuItem>])}
          <Box sx={{ gridColumn: { md: '1 / -1' } }}>
            {select('reportingManagerId', 'Reporting manager', [
              <MenuItem key="none" value=""><em>No reporting manager</em></MenuItem>,
              ...managers.map((manager) => <MenuItem key={manager.id} value={manager.id}>{manager.name} · {manager.designation}</MenuItem>),
            ])}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', border: '1px solid #dce5de', borderRadius: 2.5, boxShadow: '0 8px 22px rgba(25, 60, 37, 0.09)', display: 'flex', justifyContent: 'flex-end', p: 1.5, position: 'sticky', bottom: 12, zIndex: 2 }}>
        <Button disabled={submitting} onClick={() => navigate('/employees')} sx={{ mr: 1 }} variant="text">Cancel</Button>
        <Button disabled={submitting || loadingOptions || Boolean(optionsError)} startIcon={submitting ? <CircularProgress color="inherit" size={17} /> : <SaveIcon />} sx={{ boxShadow: '0 7px 16px rgba(47,112,69,0.24)', fontWeight: 700, minHeight: 44, px: 2.6, '&:hover': { boxShadow: '0 9px 20px rgba(47,112,69,0.3)' } }} type="submit" variant="contained">
          {submitting ? 'Creating employee…' : 'Create employee'}
        </Button>
      </Paper>
    </Stack>
  )
}
