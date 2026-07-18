import { Avatar, Badge, Box, ButtonBase, Chip, Divider, Stack, SvgIcon, Typography } from '@mui/material'

import { AppNavigation } from './AppNavigation'
import type { AppNavItem, AppShellUser } from './types'

export const APP_SIDEBAR_WIDTH = 204

type AppSidebarProps<Role extends string> = {
  navigation: readonly AppNavItem<Role>[]
  user: AppShellUser<Role>
  activePath: string
  onNavigate: (path: string) => void
  onLogout: () => void
  brand: string
}

const ProfileIcon = () => (
  <SvgIcon sx={{ fontSize: 19 }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" /></SvgIcon>
)

const SettingsIcon = () => (
  <SvgIcon sx={{ fontSize: 19 }}><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65-2-3.46-2.49 1a7.2 7.2 0 0 0-1.69-.98L15 3.27h-4l-.4 2.66c-.61.25-1.17.59-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.08.66-.08.98s.03.66.08.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.73 1.69.98l.4 2.66h4l.4-2.66c.61-.25 1.17-.58 1.69-.98l2.49 1 2-3.46-2.15-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z" /></SvgIcon>
)

const LogoutIcon = () => (
  <SvgIcon sx={{ fontSize: 19 }}><path d="M10 17v-2H3V9h7V7l5 5-5 5Zm8-14H8a2 2 0 0 0-2 2v2h2V5h10v14H8v-2H6v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" /></SvgIcon>
)

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
          background: 'linear-gradient(145deg, #17211b, #33483b)',
          borderRadius: 2.25,
          color: '#b7f0c5',
          display: 'grid',
          fontSize: '0.72rem',
          fontWeight: 850,
          height: 38,
          letterSpacing: '-0.08em',
          placeItems: 'center',
          width: 38,
          boxShadow: '0 5px 12px rgba(23, 33, 27, 0.18)',
        }}
      >
        PS
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05 }}>{brand}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.61rem', fontWeight: 600, letterSpacing: '0.08em', mt: 0.25, textTransform: 'uppercase' }}>People</Typography>
      </Box>
    </Stack>

    <Divider sx={{ my: 2.5 }} />
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', overflowY: 'auto' }}>
      <AppNavigation
        activePath={activePath}
        items={navigation}
        onNavigate={onNavigate}
        role={user.role}
      />
      <Box sx={{ mt: 'auto' }} />
    </Box>

    <Divider sx={{ my: 2 }} />
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 0.75 }}>
      <Badge
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        aria-label="Active account"
        overlap="circular"
        sx={{ '& .MuiBadge-badge': { bgcolor: '#22c55e', border: '2px solid white', borderRadius: '50%', height: 11, minWidth: 11 } }}
        variant="dot"
      >
        <Avatar alt={user.name} src={user.avatarUrl ?? undefined} sx={{ bgcolor: '#e7f3eb', color: 'primary.main', height: 40, width: 40 }}>
          <ProfileIcon />
        </Avatar>
      </Badge>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {user.name}
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'center', mt: 0.35 }}>
          <Chip
            label={user.role.replaceAll('_', ' ')}
            size="small"
            sx={{ bgcolor: '#edf5ef', color: 'primary.main', fontSize: '0.61rem', fontWeight: 750, height: 20 }}
          />
        </Stack>
      </Box>
    </Stack>

    <Stack spacing={0.25} sx={{ mt: 1.15 }}>
      <ButtonBase
        onClick={() => onNavigate('/profile')}
        sx={{ borderRadius: 2, color: 'text.secondary', gap: 1.25, justifyContent: 'flex-start', minHeight: 30, px: 0.75, transition: 'all 160ms ease', width: '100%', '&:hover': { bgcolor: 'rgba(47, 112, 69, 0.08)', color: 'primary.main', transform: 'translateX(2px)' } }}
      >
        <ProfileIcon />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>My profile</Typography>
      </ButtonBase>
      <ButtonBase
        onClick={() => onNavigate('/settings')}
        sx={{ borderRadius: 2, color: 'text.secondary', gap: 1.25, justifyContent: 'flex-start', minHeight: 30, px: 0.75, transition: 'all 160ms ease', width: '100%', '&:hover': { bgcolor: 'rgba(47, 112, 69, 0.08)', color: 'primary.main', transform: 'translateX(2px)' } }}
      >
        <SettingsIcon />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Account settings</Typography>
      </ButtonBase>
      <ButtonBase
        onClick={onLogout}
        sx={{ borderRadius: 2, color: '#c62828', gap: 1.25, justifyContent: 'flex-start', minHeight: 32, px: 0.75, transition: 'all 160ms ease', width: '100%', '&:hover': { bgcolor: '#fff0f0', color: '#b71c1c', transform: 'translateX(2px)' } }}
      >
        <LogoutIcon />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>Sign out</Typography>
      </ButtonBase>
    </Stack>
  </Stack>
)
