import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment,
  LinearProgress, Paper, Skeleton, Snackbar, Stack, SvgIcon, TextField, Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { createDepartmentRequest, listDepartmentsRequest } from '../api/departments'
import type { DepartmentSummary } from '../api/types'

const SearchIcon = () => <SvgIcon sx={{ fontSize: 19 }}><path d="M9.5 3a6.5 6.5 0 1 0 3.98 11.64L19.85 21 21 19.85l-6.36-6.37A6.5 6.5 0 0 0 9.5 3Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></SvgIcon>
const AddIcon = () => <SvgIcon sx={{ fontSize: 19 }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" /></SvgIcon>
const ArrowIcon = () => <SvgIcon sx={{ fontSize: 17 }}><path d="m9 18 6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6L9 18Z" /></SvgIcon>
const EmployeesIcon = () => <SvgIcon sx={{ fontSize: 18 }}><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" /></SvgIcon>
const DepartmentsIcon = () => <SvgIcon sx={{ fontSize: 19 }}><path d="M12 7V3H2v18h20V7H12Zm-6 12H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V9h2v2Zm4 8H8v-2h2v2Zm0-4H8v-2h2v2Zm10 4h-8V9h8v10Z" /></SvgIcon>

const palette = [
  { bg: '#e2efe6', color: '#39704a' }, { bg: '#e4edf8', color: '#466d99' },
  { bg: '#f0e7f7', color: '#755594' }, { bg: '#faebdf', color: '#98663e' },
  { bg: '#f5e6eb', color: '#96536a' }, { bg: '#e3eff0', color: '#39767c' },
]

const colorsFor = (name: string) => palette[[...name].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % palette.length]!

const iconFor = (name: string) => {
  const value = name.toLowerCase()
  if (/engineering|technology|software|it\b/.test(value)) return 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z'
  if (/people|human|hr/.test(value)) return 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Z'
  if (/finance|account/.test(value)) return 'M12 1 3 5v2h18V5l-9-4ZM5 9v7H3v3h18v-3h-2V9h-2v7h-4V9h-2v7H7V9H5Z'
  if (/marketing|brand/.test(value)) return 'M3 11v2h2l3 5h3l-2.5-5H11l8 4V7l-8 4H3Zm18-4v10h2V7h-2Z'
  if (/sales|business/.test(value)) return 'm3.5 18.49 6-6.01 4 4L22 6.92 20.59 5.5 13.5 13.48l-4-4L2 16.99l1.5 1.5Z'
  if (/design|creative|product/.test(value)) return 'M12 3a9 9 0 0 0 0 18h1.5c1.38 0 2.5-1.12 2.5-2.5 0-.39-.09-.76-.25-1.09-.17-.36.09-.78.49-.78H18A3 3 0 0 0 21 13.6C21 7.75 16.97 3 12 3ZM6.5 13A1.5 1.5 0 1 1 8 11.5 1.5 1.5 0 0 1 6.5 13ZM9 8a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 8Zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 8Zm2.5 5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5Z'
  if (/operation|support/.test(value)) return 'M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65-2-3.46-2.49 1a7.2 7.2 0 0 0-1.69-.98L15 3.27h-4l-.4 2.66c-.61.25-1.17.59-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.08.66-.08.98s.03.66.08.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.73 1.69.98l.4 2.66h4l.4-2.66c.61-.25 1.17-.58 1.69-.98l2.49 1 2-3.46-2.15-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z'
  return 'M12 7V3H2v18h20V7H12Zm-6 12H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V9h2v2Zm4 8H8v-2h2v2Zm0-4H8v-2h2v2Zm10 4h-8V9h8v10Z'
}

export const DepartmentsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(location.pathname.endsWith('/new'))
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; severity: 'error' | 'success' } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    listDepartmentsRequest(controller.signal)
      .then(({ data }) => setDepartments(data.departments))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Unable to load departments')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => departments.filter((department) => department.name.toLowerCase().includes(search.trim().toLowerCase())), [departments, search])
  const employeeTotal = departments.reduce((total, department) => total + (department.employeeCount ?? 0), 0)

  const closeDialog = () => {
    setDialogOpen(false); setName(''); setNameError(null)
    if (location.pathname.endsWith('/new')) navigate('/departments', { replace: true })
  }

  const createDepartment = async (event: FormEvent) => {
    event.preventDefault()
    const departmentName = name.trim()
    if (departmentName.length < 2) { setNameError('Please enter a department name'); return }
    setSaving(true); setNameError(null)
    try {
      const { data } = await createDepartmentRequest(departmentName)
      setDepartments((current) => [...current, { ...data.department, employeeCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
      setToast({ message: `${data.department.name} was created successfully.`, severity: 'success' })
      closeDialog()
    } catch (requestError) {
      setToast({ message: requestError instanceof ApiError ? requestError.message : 'Unable to create department', severity: 'error' })
    } finally { setSaving(false) }
  }

  return <Stack spacing={2.5}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}>
      <Box><Typography component="h1" sx={{ fontWeight: 750, letterSpacing: '-0.03em' }} variant="h4">Departments</Typography><Typography color="text.secondary" sx={{ mt: 0.45 }}>Explore Playstack teams and the people working across them.</Typography></Box>
      <Button onClick={() => setDialogOpen(true)} startIcon={<AddIcon />} sx={{ boxShadow: '0 6px 14px rgba(47,112,69,.2)', px: 2 }} variant="contained">Add department</Button>
    </Stack>

    {error && <Alert severity="error">{error}</Alert>}
    <Paper elevation={0} sx={{ alignItems: { md: 'center' }, border: '1px solid #e0e7e2', borderRadius: 2.5, boxShadow: '0 7px 20px rgba(30,65,42,.055)', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: 2 }}>
      <Stack direction="row" spacing={4.5} sx={{ alignItems: 'center', mr: { md: 'auto' } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ bgcolor: '#e3efe7', borderRadius: 1.5, color: '#39704a', display: 'flex', p: .8 }}><DepartmentsIcon /></Box><Box><Typography sx={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1 }}>{departments.length}</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .35 }}>Departments</Typography></Box></Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ bgcolor: '#e5eef8', borderRadius: 1.5, color: '#466d99', display: 'flex', p: .8 }}><EmployeesIcon /></Box><Box><Typography sx={{ color: 'primary.main', fontSize: '1.35rem', fontWeight: 800, lineHeight: 1 }}>{employeeTotal}</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .35 }}>Employees assigned</Typography></Box></Stack>
      </Stack>
    </Paper>

    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: '-8px !important' }}>
      <Box><Typography sx={{ fontSize: '1rem', fontWeight: 720 }}>All departments</Typography><Typography color="text.secondary" sx={{ fontSize: '.76rem' }}>{filtered.length} of {departments.length} teams</Typography></Box>
      <TextField fullWidth onChange={(event) => setSearch(event.target.value)} placeholder="Search departments" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} sx={{ maxWidth: 315, '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2, boxShadow: '0 3px 10px rgba(30,65,42,.04)' } }} value={search} />
    </Stack>

    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))' } }}>
      {loading ? Array.from({ length: 6 }, (_, index) => <Skeleton height={180} key={index} variant="rounded" />) : filtered.map((department) => {
        const colors = colorsFor(department.name)
        const memberCount = department.employeeCount ?? 0
        const workforceShare = employeeTotal > 0 ? (memberCount / employeeTotal) * 100 : 0
        const teamSize = memberCount >= 20 ? 'Large team' : memberCount >= 10 ? 'Growing team' : memberCount > 0 ? 'Small team' : 'Unassigned'
        return <Paper elevation={0} key={department.id} sx={{ border: '1px solid #e0e7e2', borderRadius: 2.5, boxShadow: '0 7px 20px rgba(30,65,42,.055)', p: 1.6, transition: 'transform 180ms ease, box-shadow 180ms ease', '&:hover': { boxShadow: '0 13px 28px rgba(30,65,42,.11)', transform: 'translateY(-3px)' } }}>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}><Box sx={{ alignItems: 'center', bgcolor: colors.bg, borderRadius: 1.75, color: colors.color, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}><SvgIcon sx={{ fontSize: 30 }}><path d={iconFor(department.name)} /></SvgIcon></Box><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: '.96rem', fontWeight: 720 }}>{department.name}</Typography><Typography color="text.secondary" sx={{ fontSize: '.72rem' }}>Playstack department</Typography></Box></Stack>
          <Box sx={{ bgcolor: '#f6f9f7', borderRadius: 1.5, mt: 1, px: 1.15, py: .7 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ color: colors.color, display: 'flex' }}><EmployeesIcon /></Box><Box><Typography sx={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>{memberCount}</Typography><Typography color="text.secondary" sx={{ fontSize: '.65rem', mt: .15 }}>Team members</Typography></Box></Stack>
              <Box sx={{ textAlign: 'right' }}><Typography sx={{ color: colors.color, fontSize: '.76rem', fontWeight: 750 }}>{workforceShare.toFixed(1)}%</Typography><Typography color="text.secondary" sx={{ fontSize: '.62rem' }}>of workforce</Typography></Box>
            </Stack>
            <LinearProgress value={workforceShare} variant="determinate" sx={{ bgcolor: '#e5ebe7', borderRadius: 5, height: 4, mt: .65, '& .MuiLinearProgress-bar': { bgcolor: colors.color, borderRadius: 5 } }} />
            <Typography sx={{ color: '#758179', fontSize: '.63rem', mt: .45 }}>{teamSize} · Live directory count</Typography>
          </Box>
          <Button endIcon={<ArrowIcon />} onClick={() => navigate(`/employees?departmentId=${encodeURIComponent(department.id)}`)} size="small" sx={{ color: '#47759f', fontSize: '.72rem', fontWeight: 650, minHeight: 27, mt: .65, px: .55, '& .MuiButton-endIcon': { transition: 'transform 160ms ease' }, '&:hover': { bgcolor: '#edf5fc', color: '#285f91', textDecoration: 'underline', '& .MuiButton-endIcon': { transform: 'translateX(3px)' } } }} variant="text">View employees</Button>
        </Paper>
      })}
    </Box>
    {!loading && filtered.length === 0 && <Paper elevation={0} sx={{ border: '1px dashed #ccd8cf', p: 6, textAlign: 'center' }}><Typography sx={{ fontWeight: 700 }}>No departments found</Typography><Typography color="text.secondary" variant="body2">Try a different search term.</Typography></Paper>}

    <Dialog component="form" fullWidth maxWidth="xs" onClose={closeDialog} onSubmit={createDepartment} open={dialogOpen}><DialogTitle sx={{ fontWeight: 750 }}>Add department</DialogTitle><DialogContent><Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">Create a new Playstack team for employee assignment and reporting.</Typography><TextField autoFocus error={Boolean(nameError)} fullWidth helperText={nameError} label="Department name" onChange={(event) => { setName(event.target.value); setNameError(null) }} placeholder="e.g. Product Design" value={name} /></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={closeDialog}>Cancel</Button><Button disabled={saving} startIcon={<AddIcon />} type="submit" variant="contained">{saving ? 'Creating…' : 'Create department'}</Button></DialogActions></Dialog>
    <Snackbar anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={4500} onClose={() => setToast(null)} open={Boolean(toast)}><Alert elevation={6} onClose={() => setToast(null)} severity={toast?.severity ?? 'success'} variant="filled">{toast?.message}</Alert></Snackbar>
  </Stack>
}
