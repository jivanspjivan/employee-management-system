import { Avatar, Box, Button, Divider, Stack, Typography } from '@mui/material'

import { AppNavigation } from './AppNavigation'
import type { AppNavItem, AppShellUser } from './types'

export const APP_SIDEBAR_WIDTH = 272

type AppSidebarProps<Role extends string> = {
  navigation: readonly AppNavItem<Role>[]
  user: AppShellUser<Role>
  activePath: string
  onNavigate: (path: string) => void
  onLogout: () => void
  brand: string
}

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export const AppSidebar = <Role extends string>({
  navigation,
  user,
  activePath,
  onNavigate,
  onLogout,
  brand,
}: AppSidebarProps<Role>) => (
  <Stack sx={{ height: '100%', px: 2, py: 2.5 }}>
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minHeight: 44, px: 0.75 }}>
      <Box
        aria-hidden
        sx={{
          bgcolor: 'primary.main',
          borderRadius: 2,
          color: 'primary.contrastText',
          display: 'grid',
          fontWeight: 800,
          height: 38,
          placeItems: 'center',
          width: 38,
        }}
      >
        E
      </Box>
      <Typography sx={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.15 }}>
        {brand}
      </Typography>
    </Stack>

    <Divider sx={{ my: 2.5 }} />
    <Box sx={{ flex: 1, overflowY: 'auto' }}>
      <AppNavigation
        activePath={activePath}
        items={navigation}
        onNavigate={onNavigate}
        role={user.role}
      />
    </Box>

    <Divider sx={{ my: 2 }} />
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 0.5 }}>
      <Avatar alt={user.name} src={user.avatarUrl ?? undefined} sx={{ bgcolor: 'primary.main' }}>
        {initialsFor(user.name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
          {user.name}
        </Typography>
        <Typography color="text.secondary" noWrap sx={{ fontSize: '0.75rem' }}>
          {user.role.replaceAll('_', ' ')}
        </Typography>
      </Box>
    </Stack>
    <Button color="inherit" fullWidth onClick={onLogout} sx={{ justifyContent: 'flex-start', mt: 1.5 }}>
      Sign out
    </Button>
  </Stack>
)
