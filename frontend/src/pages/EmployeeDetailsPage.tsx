import { useEffect, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Paper, Skeleton, Snackbar, Stack, SvgIcon, Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

import {
  deleteEmployeeRequest, getEmployeeReporteesRequest, getEmployeeRequest, updateEmployeeStatusRequest,
} from '../api/employees'
import type { EmployeeListItem } from '../api/types'
import { useAuth } from '../auth'

const BackIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="m20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2Z" /></SvgIcon>
const EditIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" /></SvgIcon>
const DisableIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM5.27 7.27l11.46 11.46A8 8 0 0 1 5.27 7.27Zm13.46 9.46L7.27 5.27a8 8 0 0 1 11.46 11.46Z" /></SvgIcon>
const DeleteIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12Zm3.46-7.12 1.41-1.41L12 11.59l1.12-1.12 1.41 1.41L13.41 13l1.12 1.12-1.41 1.41L12 14.41l-1.12 1.12-1.41-1.41L10.59 13l-1.13-1.12ZM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5Z" /></SvgIcon>
const WarningIcon = () => <SvgIcon sx={{ fontSize: 24 }}><path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" /></SvgIcon>
const ManagerIcon = () => <SvgIcon><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Z" /></SvgIcon>
const InfoIcon = () => <SvgIcon><path d="M11 17h2v-6h-2v6Zm1-15a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM11 9h2V7h-2v2Z" /></SvgIcon>
const ArrowIcon = () => <SvgIcon sx={{ fontSize: 17 }}><path d="m9 18 6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6L9 18Z" /></SvgIcon>

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const roleLabel = (role: string) => role.split('_').map((word) => word[0] + word.slice(1).toLowerCase()).join(' ')
const date = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
const currency = (value: string) => new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(Number(value))

const roleStyles = {
  EMPLOYEE: { background: '#edf0ee', color: '#5f6b64' },
  HR_MANAGER: { background: '#e5eef9', color: '#38699a' },
  SUPER_ADMIN: { background: '#eee7f8', color: '#72509a' },
}

const detailsCardSx = {
  border: '1px solid #dfe7e1', borderRadius: 2.5,
  boxShadow: '0 8px 22px rgba(30,65,42,.06)', overflow: 'hidden',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
  '&:hover': { borderColor: '#ccdacf', boxShadow: '0 13px 28px rgba(30,65,42,.105)', transform: 'translateY(-2px)' },
}

const Field = ({ label, value }: { label: string; value: string }) => <Box><Typography color="text.secondary" sx={{ fontSize: '.68rem', fontWeight: 650, letterSpacing: '.045em', textTransform: 'uppercase' }}>{label}</Typography><Typography sx={{ fontSize: '.9rem', fontWeight: 620, mt: .35 }}>{value || '—'}</Typography></Box>
const SectionTitle = ({ icon, subtitle, title }: { icon: React.ReactNode; subtitle: string; title: string }) => <Stack direction="row" spacing={1.1} sx={{ alignItems: 'center', bgcolor: '#edf4ef', borderBottom: '1px solid #d9e4dc', px: 2.2, py: 1.45 }}><Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box><Box><Typography sx={{ fontSize: '.92rem', fontWeight: 740 }}>{title}</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>{subtitle}</Typography></Box></Stack>

export const EmployeeDetailsPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { employee: currentEmployee } = useAuth()
  const [employee, setEmployee] = useState<EmployeeListItem | null>(null)
  const [reportees, setReportees] = useState<EmployeeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'disable' | null>(null)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(null)
    Promise.all([getEmployeeRequest(id, controller.signal), getEmployeeReporteesRequest(id, controller.signal)])
      .then(([employeeResponse, reporteeResponse]) => {
        setEmployee(employeeResponse.data.employee); setReportees(reporteeResponse.data.reportees)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Unable to load employee')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id])

  if (loading) return <Stack spacing={2.5}><Skeleton height={45} width={220} /><Skeleton height={210} variant="rounded" /><Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}><Skeleton height={300} variant="rounded" /><Skeleton height={300} variant="rounded" /></Box></Stack>
  if (error || !employee) return <Alert action={<Button onClick={() => navigate('/employees')}>Back</Button>} severity="error">{error ?? 'Employee not found'}</Alert>

  const isSelf = currentEmployee?.id === employee.id
  const hrBlocked = currentEmployee?.role === 'HR_MANAGER' && employee.role === 'SUPER_ADMIN'
  const canManage = Boolean(currentEmployee && currentEmployee.role !== 'EMPLOYEE' && !hrBlocked)
  const canDisable = canManage && !isSelf && employee.status === 'ACTIVE'
  const canDelete = currentEmployee?.role === 'SUPER_ADMIN' && !isSelf

  const performAction = async () => {
    if (!confirmAction) return
    setWorking(true); setToast(null)
    try {
      if (confirmAction === 'disable') await updateEmployeeStatusRequest(employee.id, 'INACTIVE')
      else await deleteEmployeeRequest(employee.id)
      navigate('/employees', { replace: true, state: { message: confirmAction === 'disable' ? `${employee.name} was disabled.` : `${employee.name} was deleted.` } })
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : `Unable to ${confirmAction} employee`)
      setConfirmAction(null)
    } finally { setWorking(false) }
  }

  return <Stack spacing={2.5}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
      <Box><Button color="inherit" onClick={() => navigate('/employees')} size="small" startIcon={<BackIcon />} sx={{ color: 'text.secondary', fontSize: '.74rem', px: .2 }}>Back to employees</Button><Typography component="h1" sx={{ fontWeight: 750, letterSpacing: '-.03em', mt: .25 }} variant="h4">Employee details</Typography></Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>{isSelf && currentEmployee?.role === 'EMPLOYEE' ? <Button onClick={() => navigate('/profile')} startIcon={<EditIcon />} variant="contained">Edit my profile</Button> : <>{canManage && <Button onClick={() => navigate(`/employees/${employee.id}/edit`)} startIcon={<EditIcon />} sx={{ px: 2.35 }} variant="contained">Edit employee</Button>}{canDisable && <Button color="warning" onClick={() => setConfirmAction('disable')} startIcon={<DisableIcon />} variant="outlined">Disable</Button>}{canDelete && <Button color="error" onClick={() => setConfirmAction('delete')} startIcon={<DeleteIcon />} variant="outlined">Delete</Button>}</>}</Stack>
    </Stack>

    {hrBlocked && <Alert severity="info">HR Managers can view this Super Admin profile but cannot modify it.</Alert>}
    <Paper elevation={0} sx={{ background: 'linear-gradient(120deg,#173d29 0%,#2f7045 65%,#4c8960 100%)', borderRadius: 3, boxShadow: '0 13px 30px rgba(27,67,41,.17)', color: '#fff', p: { xs: 2, md: 2.2 } }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.7} sx={{ alignItems: { sm: 'center' } }}><Avatar src={employee.profileImageUrl ?? undefined} sx={{ bgcolor: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.3)', fontSize: '1.2rem', fontWeight: 750, height: 60, width: 60 }}>{initials(employee.name)}</Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: '1.3rem', fontWeight: 760 }}>{employee.name}</Typography><Typography sx={{ color: 'rgba(255,255,255,.78)', fontSize: '.88rem', mt: .1 }}>{employee.designation} · {employee.department.name}</Typography><Stack direction="row" spacing={.8} sx={{ mt: .75 }}><Chip label={roleLabel(employee.role)} size="small" sx={{ bgcolor: 'rgba(255,255,255,.15)', color: '#fff', height: 24 }} /><Chip label={employee.status === 'ACTIVE' ? '● Active' : '● Inactive'} size="small" sx={{ bgcolor: employee.status === 'ACTIVE' ? 'rgba(192,240,205,.18)' : 'rgba(255,190,190,.18)', color: '#fff', height: 24 }} /></Stack></Box><Box sx={{ textAlign: { sm: 'right' } }}><Typography sx={{ color: 'rgba(255,255,255,.63)', fontSize: '.64rem', textTransform: 'uppercase' }}>Employee ID</Typography><Typography sx={{ fontSize: '.92rem', fontWeight: 720, mt: .2 }}>{employee.employeeId}</Typography></Box></Stack></Paper>

    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.1fr) minmax(0,.9fr)' } }}>
      <Paper elevation={0} sx={detailsCardSx}><SectionTitle icon={<InfoIcon />} subtitle="Personal and workplace record" title="Employee information" /><Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, p: 2.3 }}><Field label="Full name" value={employee.name} /><Field label="Work email" value={employee.email} /><Field label="Phone" value={employee.phone ?? 'Not provided'} /><Field label="Department" value={employee.department.name} /><Field label="Designation" value={employee.designation} /><Field label="Annual salary" value={currency(employee.salary)} /><Field label="Joining date" value={date(employee.joiningDate)} /><Field label="Role" value={roleLabel(employee.role)} /></Box></Paper>
      <Stack spacing={2} sx={{ '& > .MuiPaper-root': { transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease' }, '& > .MuiPaper-root:hover': { borderColor: '#ccdacf', boxShadow: '0 13px 28px rgba(30,65,42,.105)', transform: 'translateY(-2px)' } }}>
        <Paper elevation={0} sx={{ border: '1px solid #dfe7e1', borderRadius: 2.5, boxShadow: '0 8px 22px rgba(30,65,42,.06)', overflow: 'hidden' }}><SectionTitle icon={<ManagerIcon />} subtitle="Current reporting relationship" title="Reporting manager" /><Box sx={{ p: 2.2 }}>{employee.reportingManager ? <Stack direction="row" spacing={1.3} sx={{ alignItems: 'center' }}><Avatar sx={{ bgcolor: '#e3efe7', color: '#39704a', fontSize: '.85rem', fontWeight: 700 }}>{initials(employee.reportingManager.name)}</Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 700 }}>{employee.reportingManager.name}</Typography><Typography color="text.secondary" variant="body2">{employee.reportingManager.employeeId}</Typography></Box><Button endIcon={<ArrowIcon />} onClick={() => navigate(`/employees/${employee.reportingManager!.id}`)} size="small">View</Button></Stack> : <Typography color="text.secondary" variant="body2">No reporting manager has been assigned.</Typography>}</Box></Paper>
        <Paper elevation={0} sx={{ border: '1px solid #dfe7e1', borderRadius: 2.5, boxShadow: '0 8px 22px rgba(30,65,42,.06)', overflow: 'hidden' }}><SectionTitle icon={<ManagerIcon />} subtitle={`${reportees.length} employee${reportees.length === 1 ? '' : 's'} report directly`} title="Direct reportees" /><Stack divider={<Divider />} sx={{ maxHeight: 300, overflowY: 'auto' }}>{reportees.length ? reportees.map((reportee) => <Stack direction="row" key={reportee.id} spacing={1.2} sx={{ alignItems: 'center', px: 2.1, py: 1.25, '&:hover': { bgcolor: '#f5f9f6' } }}><Avatar src={reportee.profileImageUrl ?? undefined} sx={{ bgcolor: '#e5eef8', color: '#466d99', fontSize: '.76rem', fontWeight: 700, height: 34, width: 34 }}>{initials(reportee.name)}</Avatar><Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontSize: '.84rem', fontWeight: 680 }}>{reportee.name}</Typography><Typography color="text.secondary" noWrap sx={{ fontSize: '.7rem' }}>{reportee.designation}</Typography></Box><Chip label={roleLabel(reportee.role)} size="small" sx={{ ...roleStyles[reportee.role], fontSize: '.62rem', height: 22 }} /><Button onClick={() => navigate(`/employees/${reportee.id}`)} size="small" sx={{ minWidth: 32 }}>View</Button></Stack>) : <Box sx={{ p: 1.7 }}><Stack spacing={1.15} sx={{ alignItems: 'center', bgcolor: '#f5f9f6', border: '1px dashed #cbdacf', borderRadius: 2, px: 2, py: 2.2, textAlign: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: '#dfede4', borderRadius: '50%', color: '#4b805d', display: 'flex', height: 44, justifyContent: 'center', width: 44 }}><ManagerIcon /></Box><Box><Typography sx={{ color: '#304c39', fontSize: '.86rem', fontWeight: 720 }}>No direct reportees yet</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .3 }}>This employee is currently an individual contributor or has no assigned team members.</Typography></Box></Stack></Box>}</Stack></Paper>
      </Stack>
    </Box>

    <Dialog fullWidth maxWidth="xs" onClose={() => !working && setConfirmAction(null)} open={Boolean(confirmAction)} slotProps={{ paper: { sx: { borderRadius: 3 } } }}><DialogTitle sx={{ alignItems: 'center', display: 'flex', gap: 1.2, pb: 1.2 }}><Box sx={{ alignItems: 'center', bgcolor: confirmAction === 'delete' ? '#fdeaea' : '#fff2dc', borderRadius: '50%', color: confirmAction === 'delete' ? '#c43f3f' : '#b86a19', display: 'flex', height: 42, justifyContent: 'center', width: 42 }}><WarningIcon /></Box><Box><Typography sx={{ fontSize: '1.05rem', fontWeight: 760 }}>{confirmAction === 'delete' ? 'Delete employee?' : 'Disable employee?'}</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', fontWeight: 400 }}>Please review before confirming</Typography></Box></DialogTitle><DialogContent><Paper elevation={0} sx={{ bgcolor: '#f7f9f7', border: '1px solid #e2e8e3', borderRadius: 2, p: 1.5 }}><Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}><Avatar src={employee.profileImageUrl ?? undefined} sx={{ bgcolor: '#e3efe7', color: '#39704a', fontSize: '.8rem', fontWeight: 700, height: 38, width: 38 }}>{initials(employee.name)}</Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: '.86rem', fontWeight: 700 }}>{employee.name}</Typography><Typography color="text.secondary" sx={{ fontSize: '.7rem' }}>{employee.employeeId} · {employee.designation}</Typography></Box><Chip label="Active" size="small" sx={{ bgcolor: '#e2f2e7', color: '#34734a', fontSize: '.62rem', height: 22 }} /></Stack></Paper><Box sx={{ bgcolor: confirmAction === 'delete' ? '#fff5f5' : '#fff9ef', borderLeft: `3px solid ${confirmAction === 'delete' ? '#d35b5b' : '#d68a36'}`, borderRadius: 1.5, mt: 1.5, px: 1.5, py: 1.2 }}><Typography sx={{ color: confirmAction === 'delete' ? '#8f3535' : '#80521f', fontSize: '.79rem', fontWeight: 650 }}>{confirmAction === 'delete' ? 'The employee will be removed from active records.' : 'Status will change from Active to Inactive.'}</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .35 }}>{confirmAction === 'delete' ? 'Their account access will be revoked immediately.' : 'They will no longer be able to sign in until reactivated.'}</Typography></Box></DialogContent><DialogActions sx={{ px: 3, pb: 2.5, pt: 1.2 }}><Button disabled={working} onClick={() => setConfirmAction(null)} variant="outlined">Cancel</Button><Button color={confirmAction === 'delete' ? 'error' : 'warning'} disabled={working} onClick={() => void performAction()} startIcon={confirmAction === 'delete' ? <DeleteIcon /> : <DisableIcon />} variant="contained">{working ? 'Processing…' : confirmAction === 'delete' ? 'Delete employee' : 'Disable employee'}</Button></DialogActions></Dialog>
    <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setToast(null)} open={Boolean(toast)}><Alert elevation={6} onClose={() => setToast(null)} severity="error" variant="filled">{toast}</Alert></Snackbar>
  </Stack>
}
