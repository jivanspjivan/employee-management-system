import { Box, ButtonBase, Stack, Typography } from '@mui/material'

import type { AppNavItem } from './types'

type AppNavigationProps<Role extends string> = {
  items: readonly AppNavItem<Role>[]
  role: Role
  activePath: string
  onNavigate: (path: string) => void
}

export const AppNavigation = <Role extends string>({
  items,
  role,
  activePath,
  onNavigate,
}: AppNavigationProps<Role>) => {
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <Stack component="nav" aria-label="Main navigation" spacing={0.75}>
      {visibleItems.map((item) => {
        const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`)

        return (
          <ButtonBase
            key={item.path}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(item.path)}
            sx={{
              borderRadius: 2,
              color: isActive ? 'primary.main' : 'text.secondary',
              justifyContent: 'flex-start',
              minHeight: 44,
              px: 1.5,
              textAlign: 'left',
              transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
              width: '100%',
              ...(isActive && {
                bgcolor: 'primary.main',
                boxShadow: '0 6px 16px rgba(47, 112, 69, 0.2)',
                color: 'primary.contrastText',
              }),
              '&:hover': {
                bgcolor: isActive ? 'primary.dark' : 'rgba(47, 112, 69, 0.08)',
                color: isActive ? 'primary.contrastText' : 'primary.main',
                transform: 'translateX(3px)',
              },
            }}
          >
            {item.icon && (
              <Box aria-hidden sx={{ display: 'grid', mr: 1.25, placeItems: 'center' }}>
                {item.icon}
              </Box>
            )}
            <Typography sx={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }}>
              {item.label}
            </Typography>
            {Boolean(item.badge) && (
              <Box
                aria-label={`${item.badge} pending`}
                sx={{
                  bgcolor: isActive ? 'rgba(255,255,255,.22)' : 'error.main',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: '.68rem',
                  fontWeight: 800,
                  ml: 'auto',
                  minWidth: 22,
                  px: .7,
                  py: .2,
                  textAlign: 'center',
                }}
              >
                {item.badge! > 99 ? '99+' : item.badge}
              </Box>
            )}
          </ButtonBase>
        )
      })}
    </Stack>
  )
}
