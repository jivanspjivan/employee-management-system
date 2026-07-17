import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider, Paper, Snackbar, Stack,
  SvgIcon, TextField, Typography,
} from '@mui/material'

import { ApiError } from '../api/client'
import { getEmployeeRequest, updateOwnProfileRequest } from '../api/employees'
import type { EmployeeListItem } from '../api/types'
import { useAuth } from '../auth'

const EditIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" /></SvgIcon>
const SaveIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M17 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v4Z" /></SvgIcon>
const PersonIcon = () => <SvgIcon><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" /></SvgIcon>
const WorkIcon = () => <SvgIcon><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4C8.89 2 8 2.89 8 4v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2Zm-6 0h-4V4h4v2Z" /></SvgIcon>

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const roleLabel = (role: string) => role.split('_').map((word) => word[0] + word.slice(1).toLowerCase()).join(' ')
const formatDate = (date: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))

const detailIcons = {
  department: 'M12 7V3H2v18h20V7H12Zm-6 12H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V9h2v2Zm4 8H8v-2h2v2Zm10 0h-8V9h8v10Z',
  designation: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4C8.89 2 8 2.89 8 4v2H4c-1.11 0-2 .89-2 2v11h18V8c0-1.11-.89-2-2-2Zm-6 0h-4V4h4v2Z',
  role: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z',
  date: 'M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14h18V6c0-1.1-.9-2-2-2Zm0 14H5V9h14v9Z',
  manager: 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Z',
  status: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z',
}

const Detail = ({ icon, label, value }: { icon?: string; label: string; value: string }) => <Stack direction="row" spacing={1.1} sx={{ alignItems: 'flex-start' }}>{icon && <Box sx={{ bgcolor: '#e8f1eb', borderRadius: 1.3, color: 'primary.main', display: 'flex', p: .65 }}><SvgIcon sx={{ fontSize: 17 }}><path d={icon} /></SvgIcon></Box>}<Box><Typography color="text.secondary" sx={{ fontSize: '.68rem', fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</Typography><Typography sx={{ fontSize: '.92rem', fontWeight: 650, mt: .3 }}>{value || '—'}</Typography></Box></Stack>

const editableInputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fcfdfc',
    '& fieldset': { borderColor: '#dfe7e1' },
    '&:hover fieldset': { borderColor: '#aebfb2' },
    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 3px rgba(47,112,69,.09)' },
    '&.Mui-focused fieldset': { borderColor: '#3f8156', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { color: '#647269', fontWeight: 500 },
}

export const ProfilePage = () => {
  const { employee, refreshEmployee } = useAuth()
  const [detail, setDetail] = useState<EmployeeListItem | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(employee?.name ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [phone, setPhone] = useState(employee?.phone ?? '')
  const [profileImageUrl, setProfileImageUrl] = useState(employee?.profileImageUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; severity: 'error' | 'success' } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!employee) return
    const controller = new AbortController()
    getEmployeeRequest(employee.id, controller.signal).then(({ data }) => setDetail(data.employee)).catch(() => undefined)
    return () => controller.abort()
  }, [employee])

  if (!employee) return null
  const canEditEmail = employee.role !== 'EMPLOYEE'

  const cancel = () => {
    setName(employee.name); setEmail(employee.email); setPhone(employee.phone ?? ''); setProfileImageUrl(employee.profileImageUrl ?? '')
    setError(null); setEditing(false)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) { setError('Please enter your full name'); return }
    if (canEditEmail && !/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address'); return }
    if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) { setError('Please enter a valid phone number'); return }
    if (profileImageUrl) { try { new URL(profileImageUrl) } catch { setError('Please enter a valid profile image URL'); return } }
    setSaving(true); setError(null)
    try {
      await updateOwnProfileRequest(employee.id, {
        ...(canEditEmail && { email: email.trim().toLowerCase() }), name: name.trim(),
        phone: phone.trim() || null, profileImageUrl: profileImageUrl.trim() || null,
      })
      await refreshEmployee()
      setEditing(false); setToast({ message: 'Your profile was updated successfully.', severity: 'success' })
    } catch (requestError) {
      setToast({ message: requestError instanceof ApiError ? requestError.message : 'Unable to update your profile', severity: 'error' })
    } finally { setSaving(false) }
  }

  return <Stack component="form" onSubmit={save} spacing={2.5}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}><Box><Typography component="h1" sx={{ fontWeight: 750, letterSpacing: '-.03em' }} variant="h4">My profile</Typography><Typography color="text.secondary" sx={{ mt: .4 }}>Manage your personal details and view your Playstack employment record.</Typography></Box>{!editing && <Button onClick={() => setEditing(true)} startIcon={<EditIcon />} variant="outlined">Edit profile</Button>}</Stack>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper elevation={0} sx={{ background: 'linear-gradient(120deg,#173d29 0%,#2f7045 65%,#4c8960 100%)', borderRadius: 3, boxShadow: '0 12px 28px rgba(27,67,41,.17)', color: '#fff', overflow: 'hidden', p: { xs: 2, md: 2.2 } }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.8} sx={{ alignItems: { sm: 'center' } }}><Avatar src={profileImageUrl || undefined} sx={{ bgcolor: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.3)', fontSize: '1.2rem', fontWeight: 750, height: 60, width: 60 }}>{initials(name)}</Avatar><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: '1.3rem', fontWeight: 760 }}>{employee.name}</Typography><Typography sx={{ color: 'rgba(255,255,255,.78)', fontSize: '.88rem', mt: .1 }}>{employee.designation} · {employee.department.name}</Typography><Stack direction="row" spacing={.8} sx={{ mt: .8 }}><Chip label={roleLabel(employee.role)} size="small" sx={{ bgcolor: 'rgba(255,255,255,.15)', color: '#fff', height: 24 }} /><Chip label={employee.status === 'ACTIVE' ? '● Active' : '● Inactive'} size="small" sx={{ bgcolor: 'rgba(255,255,255,.15)', color: '#fff', height: 24 }} /></Stack></Box><Box sx={{ textAlign: { sm: 'right' } }}><Typography sx={{ color: 'rgba(255,255,255,.65)', fontSize: '.65rem', textTransform: 'uppercase' }}>Employee ID</Typography><Typography sx={{ fontSize: '.94rem', fontWeight: 700, mt: .2 }}>{employee.employeeId}</Typography></Box></Stack></Paper>
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.05fr) minmax(0,.95fr)' } }}>
      <Paper elevation={0} sx={{ border: '1px solid #dfe7e1', borderRadius: 2.5, boxShadow: '0 8px 22px rgba(30,65,42,.06)', overflow: 'hidden' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', bgcolor: '#edf4ef', borderBottom: '1px solid #d9e4dc', color: 'primary.main', px: 2.2, py: 1.5 }}>
          <PersonIcon />
          <Typography sx={{ color: 'text.primary', fontWeight: 730 }}>Personal information</Typography>
        </Stack>
        <Stack spacing={2.1} sx={{ p: 2.3 }}>
          {editing ? (
            <>
              <TextField fullWidth label="Full name" onChange={(event) => setName(event.target.value)} size="small" sx={editableInputSx} value={name} />
              <TextField disabled={!canEditEmail} fullWidth helperText={!canEditEmail ? 'Email changes are restricted for Employee accounts' : undefined} label="Work email" onChange={(event) => setEmail(event.target.value)} size="small" sx={editableInputSx} value={email} />
              <TextField fullWidth label="Phone number" onChange={(event) => setPhone(event.target.value)} size="small" sx={editableInputSx} value={phone} />
              <TextField fullWidth label="Profile image URL" onChange={(event) => setProfileImageUrl(event.target.value)} size="small" sx={editableInputSx} value={profileImageUrl} />
            </>
          ) : (
            <Box sx={{ display: 'grid', gap: 2.2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' } }}>
              <Detail label="Full name" value={employee.name} />
              <Detail label="Work email" value={employee.email} />
              <Detail label="Phone" value={employee.phone ?? 'Not provided'} />
            </Box>
          )}
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ border: '1px solid #dfe7e1', borderRadius: 2.5, boxShadow: '0 8px 22px rgba(30,65,42,.06)', overflow: 'hidden' }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', bgcolor: '#edf4ef', borderBottom: '1px solid #d9e4dc', color: 'primary.main', px: 2.2, py: 1.5 }}><WorkIcon /><Typography sx={{ color: 'text.primary', fontWeight: 730 }}>Employment details</Typography></Stack><Box sx={{ display: 'grid', gap: 2.8, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, p: 2.3 }}><Detail icon={detailIcons.department} label="Department" value={employee.department.name} /><Detail icon={detailIcons.designation} label="Designation" value={employee.designation} /><Detail icon={detailIcons.role} label="Role" value={roleLabel(employee.role)} /><Detail icon={detailIcons.date} label="Joining date" value={formatDate(employee.joiningDate)} /><Detail icon={detailIcons.manager} label="Reporting manager" value={detail?.reportingManager?.name ?? 'Not assigned'} /><Detail icon={detailIcons.status} label="Status" value={employee.status === 'ACTIVE' ? 'Active' : 'Inactive'} /></Box></Paper>
    </Box>
    {editing && <Paper elevation={0} sx={{ alignItems: { sm: 'center' }, background: 'linear-gradient(90deg,#edf6f0 0%,#f9fbf9 65%,#fff 100%)', border: '1px solid #cfe0d4', borderLeft: '4px solid #4b8a60', borderRadius: 2.5, bottom: 12, boxShadow: '0 10px 25px rgba(25,60,37,.11)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.2, justifyContent: 'space-between', p: 1.35, position: 'sticky' }}><Stack direction="row" spacing={1.15} sx={{ alignItems: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: '#d9ebdf', borderRadius: 1.7, color: 'primary.main', display: 'flex', height: 38, justifyContent: 'center', width: 38 }}><EditIcon /></Box><Box><Stack direction="row" spacing={.8} sx={{ alignItems: 'center' }}><Typography sx={{ color: '#25462f', fontSize: '.84rem', fontWeight: 750 }}>Unsaved profile changes</Typography><Chip label="Editing" size="small" sx={{ bgcolor: '#dcece1', color: '#39704a', fontSize: '.62rem', fontWeight: 700, height: 20 }} /></Stack><Typography color="text.secondary" sx={{ fontSize: '.7rem', mt: .15 }}>Review your details, then save when you’re ready.</Typography></Box></Stack><Stack direction="row" spacing={1}><Button disabled={saving} onClick={cancel} sx={{ bgcolor: '#fff' }} variant="outlined">Discard</Button><Button disabled={saving} startIcon={saving ? <CircularProgress color="inherit" size={17} /> : <SaveIcon />} sx={{ boxShadow: '0 5px 12px rgba(47,112,69,.2)' }} type="submit" variant="contained">{saving ? 'Saving…' : 'Save changes'}</Button></Stack></Paper>}
    <Divider />
    <Typography color="text.secondary" sx={{ fontSize: '.75rem' }}>Employment information is managed by your administrator. Contact HR if any workplace details are incorrect.</Typography>
    <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setToast(null)} open={Boolean(toast)}><Alert elevation={6} onClose={() => setToast(null)} severity={toast?.severity ?? 'success'} variant="filled">{toast?.message}</Alert></Snackbar>
  </Stack>
}
