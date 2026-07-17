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
              width: '100%',
              ...(isActive && {
                bgcolor: 'rgba(47, 112, 69, 0.1)',
                boxShadow: 'inset 3px 0 0 #2f7045',
              }),
              '&:hover': { bgcolor: isActive ? 'rgba(47, 112, 69, 0.14)' : 'action.hover' },
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
          </ButtonBase>
        )
      })}
    </Stack>
  )
}
