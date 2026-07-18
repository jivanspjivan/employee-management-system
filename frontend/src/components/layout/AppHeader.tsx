import { useEffect, useState } from 'react'
import { AppBar, Avatar, Badge, Box, Button, CircularProgress, Divider, IconButton, InputBase, Paper, Stack, SvgIcon, Toolbar, Typography } from '@mui/material'

import { searchEmployeesRequest } from '../../api/employees'
import type { EmployeeSearchResult } from '../../api/types'
import type { AppShellUser } from './types'

type AppHeaderProps<Role extends string> = {
  title: string
  user: AppShellUser<Role>
  onNavigate: (path: string) => void
  onOpenMenu: () => void
  notificationCount?: number
  notificationPath?: string
}

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

export const AppHeader = <Role extends string>({ title, user, onNavigate, onOpenMenu, notificationCount = 0, notificationPath }: AppHeaderProps<Role>) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EmployeeSearchResult[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const canSearchEmployees = user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER'

  useEffect(() => {
    const search = query.trim()
    if (!canSearchEmployees || search.length < 2) {
      setResults([]); setHasMore(false); setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      searchEmployeesRequest(search, 4, controller.signal)
        .then(({ data }) => { setResults(data.employees); setHasMore(data.hasMore) })
        .catch(() => { if (!controller.signal.aborted) { setResults([]); setHasMore(false) } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 350)

    return () => { window.clearTimeout(timer); controller.abort() }
  }, [canSearchEmployees, query])

  const openEmployee = (employeeId: string) => {
    setFocused(false); setQuery(''); onNavigate(`/employees/${employeeId}`)
  }

  const seeAll = () => {
    const search = query.trim()
    if (!search) return
    setFocused(false)
    onNavigate(`/employees?search=${encodeURIComponent(search)}`)
  }

  const showResults = focused && canSearchEmployees && query.trim().length >= 2

  return (
  <AppBar
    color="inherit"
    elevation={0}
    position="sticky"
    sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.92)' }}
  >
    <Toolbar sx={{ alignItems: 'center', gap: { xs: .7, sm: 1, md: 2 }, minHeight: { xs: 68, md: 72 }, pl: { xs: '20px !important', sm: '24px !important' }, pr: { xs: '20px !important', sm: '24px !important' } }}>
      <IconButton
        aria-label="Open navigation"
        onClick={onOpenMenu}
        sx={{ display: { md: 'none' }, flexShrink: 0, height: 38, p: .75, width: 38 }}
      >
        <Box aria-hidden component="span" sx={{ fontSize: 24, lineHeight: 1 }}>
          ☰
        </Box>
      </IconButton>
      <Box sx={{ alignItems: 'center', display: { xs: 'flex', md: 'none' }, gap: 1 }}>
        <Box sx={{ background: 'linear-gradient(145deg, #17211b, #33483b)', borderRadius: 1.5, color: '#b7f0c5', display: 'grid', fontSize: '0.61rem', fontWeight: 850, height: 30, letterSpacing: '-0.08em', placeItems: 'center', width: 30 }}>PS</Box>
      </Box>
      <Typography
        component="h1"
        noWrap
        sx={{ flex: { xs: 1, md: 'initial' }, fontSize: { xs: '1rem', md: '1.35rem' }, fontWeight: 750, minWidth: 0 }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: '#f4f7f5',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          display: { xs: 'none', md: 'flex' },
          maxWidth: 320,
          ml: 'auto',
          px: 1.5,
          width: '30vw',
          position: 'relative',
        }}
      >
        <SvgIcon sx={{ color: 'text.secondary', fontSize: 20 }}><path d="M9.5 3a6.5 6.5 0 1 0 3.98 11.64L19.85 21 21 19.85l-6.36-6.37A6.5 6.5 0 0 0 9.5 3Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></SvgIcon>
        <InputBase disabled={!canSearchEmployees} inputProps={{ 'aria-label': 'Search employees by name or email' }} onBlur={() => window.setTimeout(() => setFocused(false), 150)} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} placeholder={canSearchEmployees ? 'Search name or email...' : 'Search unavailable'} sx={{ flex: 1, fontSize: '0.82rem', ml: 1, py: 0.15 }} value={query} />
        {loading && <CircularProgress size={15} sx={{ color: 'text.secondary' }} />}
        {showResults && <Paper elevation={0} sx={{ border: '1px solid #dce5df', borderRadius: 2.2, boxShadow: '0 16px 36px rgba(25,60,37,.16)', left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 1400 }}>
          <Box sx={{ bgcolor: '#f3f7f4', borderBottom: '1px solid #e2e9e4', px: 1.5, py: 1 }}><Typography sx={{ color: '#536159', fontSize: '.66rem', fontWeight: 720, letterSpacing: '.045em', textTransform: 'uppercase' }}>Employee results</Typography></Box>
          {loading && results.length === 0 ? <Box sx={{ p: 2.5, textAlign: 'center' }}><CircularProgress size={20} /></Box> : results.length ? <Stack divider={<Divider />}>
            {results.map((employee) => <Button key={employee.id} onMouseDown={(event) => event.preventDefault()} onClick={() => openEmployee(employee.id)} sx={{ borderRadius: 0, color: 'text.primary', justifyContent: 'flex-start', px: 1.4, py: 1, textAlign: 'left', textTransform: 'none', '&:hover': { bgcolor: '#f1f7f3' } }}><Avatar src={employee.profileImageUrl ?? undefined} sx={{ bgcolor: '#e1eee5', color: '#39704a', fontSize: '.68rem', fontWeight: 700, height: 32, mr: 1.1, width: 32 }}>{initials(employee.name)}</Avatar><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: '.78rem', fontWeight: 680 }}>{employee.name}</Typography><Typography color="text.secondary" noWrap sx={{ fontSize: '.66rem' }}>{employee.email}</Typography></Box></Button>)}
          </Stack> : !loading && <Box sx={{ px: 2, py: 2.5, textAlign: 'center' }}><Typography sx={{ fontSize: '.78rem', fontWeight: 680 }}>No employees found</Typography><Typography color="text.secondary" sx={{ fontSize: '.68rem', mt: .25 }}>Try another name or email address.</Typography></Box>}
          {hasMore && <Box sx={{ bgcolor: '#fbfcfb', borderTop: '1px solid #e4eae6', p: .75 }}><Button fullWidth onMouseDown={(event) => event.preventDefault()} onClick={seeAll} size="small" sx={{ fontSize: '.72rem', fontWeight: 680 }}>See all results</Button></Box>}
        </Paper>}
      </Box>
      <Button
        startIcon={<SvgIcon sx={{ fontSize: 18 }}><path d="M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z" /></SvgIcon>}
        sx={{ borderColor: 'divider', color: 'text.secondary', display: { xs: 'none', md: 'inline-flex' }, minWidth: 88 }}
        variant="outlined"
      >
        Filter
      </Button>
      <Stack direction="row" spacing={{ xs: .55, sm: 1 }} sx={{ alignItems: 'center', ml: { xs: 0, md: 'auto' } }}>
        {notificationPath && <IconButton aria-label="Open notifications" onClick={() => onNavigate(notificationPath)} sx={{ height: { xs: 38, sm: 40 }, p: { xs: .8, sm: 1 }, width: { xs: 38, sm: 40 } }}>
          <Badge badgeContent={notificationCount} color="error" max={99}>
            <SvgIcon><path d="M12 22a2.01 2.01 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.08-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.91 6 11v5l-2 2v1h16v-1l-2-2Z" /></SvgIcon>
          </Badge>
        </IconButton>}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
          <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 650 }}>
            {user.name}
          </Typography>
          {user.email && (
            <Typography color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>
              {user.email}
            </Typography>
          )}
        </Box>
        <Avatar alt={user.name} src={user.avatarUrl ?? undefined} sx={{ height: { xs: 32, sm: 36 }, width: { xs: 32, sm: 36 } }} />
      </Stack>
    </Toolbar>
  </AppBar>
  )
}
