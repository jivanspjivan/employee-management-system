import { useState } from 'react'
import { Box, Drawer } from '@mui/material'

import { AppHeader } from './AppHeader'
import { APP_SIDEBAR_WIDTH, AppSidebar } from './AppSidebar'
import type { AppShellProps } from './types'

export const AppShell = <Role extends string>({
  children,
  navigation,
  user,
  activePath,
  onNavigate,
  onLogout,
  title = 'Dashboard',
  brand = 'Playstack',
}: AppShellProps<Role>) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigateFromDrawer = (path: string) => {
    onNavigate(path)
    setMobileOpen(false)
  }

  const sidebar = (navigate: (path: string) => void) => (
    <AppSidebar
      activePath={activePath}
      brand={brand}
      navigation={navigation}
      onLogout={onLogout}
      onNavigate={navigate}
      user={user}
    />
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <Box
        component="aside"
        sx={{
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
          width: APP_SIDEBAR_WIDTH,
        }}
      >
        <Box sx={{ height: '100dvh', position: 'sticky', top: 0 }}>{sidebar(onNavigate)}</Box>
      </Box>

      <Drawer
        ModalProps={{ keepMounted: true }}
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        slotProps={{ paper: { sx: { width: APP_SIDEBAR_WIDTH } } }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {sidebar(navigateFromDrawer)}
      </Drawer>

      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
        <AppHeader onOpenMenu={() => setMobileOpen(true)} title={title} user={user} />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 } }}>
          <Box
            key={activePath}
            sx={{
              animation: 'pageEnter 240ms cubic-bezier(0.2, 0.7, 0.3, 1)',
              '@keyframes pageEnter': {
                from: { opacity: 0, transform: 'translateY(7px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
