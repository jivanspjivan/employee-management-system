import { AppBar, Avatar, Badge, Box, Button, IconButton, InputBase, Stack, SvgIcon, Toolbar, Typography } from '@mui/material'

import type { AppShellUser } from './types'

type AppHeaderProps<Role extends string> = {
  title: string
  user: AppShellUser<Role>
  onOpenMenu: () => void
}

export const AppHeader = <Role extends string>({ title, user, onOpenMenu }: AppHeaderProps<Role>) => (
  <AppBar
    color="inherit"
    elevation={0}
    position="sticky"
    sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.92)' }}
  >
    <Toolbar sx={{ gap: { xs: 1, md: 2 }, minHeight: { xs: 64, md: 72 } }}>
      <IconButton
        aria-label="Open navigation"
        edge="start"
        onClick={onOpenMenu}
        sx={{ display: { md: 'none' }, mr: 1 }}
      >
        <Box aria-hidden component="span" sx={{ fontSize: 24, lineHeight: 1 }}>
          ☰
        </Box>
      </IconButton>
      <Box sx={{ alignItems: 'center', display: { xs: 'flex', md: 'none' }, gap: 1 }}>
        <Box sx={{ background: 'linear-gradient(145deg, #17211b, #33483b)', borderRadius: 1.5, color: '#b7f0c5', display: 'grid', fontSize: '0.65rem', fontWeight: 850, height: 32, letterSpacing: '-0.08em', placeItems: 'center', width: 32 }}>PS</Box>
      </Box>
      <Typography
        component="h1"
        sx={{ fontSize: { xs: '1.1rem', md: '1.35rem' }, fontWeight: 750 }}
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
        }}
      >
        <SvgIcon sx={{ color: 'text.secondary', fontSize: 20 }}><path d="M9.5 3a6.5 6.5 0 1 0 3.98 11.64L19.85 21 21 19.85l-6.36-6.37A6.5 6.5 0 0 0 9.5 3Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></SvgIcon>
        <InputBase inputProps={{ 'aria-label': 'Search employees' }} placeholder="Search employees..." sx={{ flex: 1, fontSize: '0.82rem', ml: 1, py: 0.15 }} />
      </Box>
      <Button
        startIcon={<SvgIcon sx={{ fontSize: 18 }}><path d="M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z" /></SvgIcon>}
        sx={{ borderColor: 'divider', color: 'text.secondary', display: { xs: 'none', md: 'inline-flex' }, minWidth: 88 }}
        variant="outlined"
      >
        Filter
      </Button>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: 'auto' }}>
        <IconButton aria-label="Notifications">
          <Badge color="error" variant="dot">
            <SvgIcon><path d="M12 22a2.01 2.01 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.08-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.91 6 11v5l-2 2v1h16v-1l-2-2Z" /></SvgIcon>
          </Badge>
        </IconButton>
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
        <Avatar alt={user.name} src={user.avatarUrl ?? undefined} sx={{ height: 36, width: 36 }} />
      </Stack>
    </Toolbar>
  </AppBar>
)
