import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material'

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
    <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }}>
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
      <Typography
        component="h1"
        sx={{ fontSize: { xs: '1.1rem', md: '1.35rem' }, fontWeight: 750 }}
      >
        {title}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: 'auto' }}>
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
