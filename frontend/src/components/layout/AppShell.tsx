import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'

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
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false)

  const navigateFromDrawer = (path: string) => {
    onNavigate(path)
    setMobileOpen(false)
  }

  const sidebar = (navigate: (path: string) => void) => (
    <AppSidebar
      activePath={activePath}
      brand={brand}
      navigation={navigation}
      onLogout={() => setLogoutConfirmationOpen(true)}
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
        <AppHeader onNavigate={onNavigate} onOpenMenu={() => setMobileOpen(true)} title={title} user={user} />
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

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setLogoutConfirmationOpen(false)}
        open={logoutConfirmationOpen}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box sx={{ alignItems: 'center', bgcolor: '#fdecec', borderRadius: '50%', color: '#c43f3f', display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
              <SvgIcon><path d="M10 17v-2H3V9h7V7l5 5-5 5Zm8-14H8a2 2 0 0 0-2 2v2h2V5h10v14H8v-2H6v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" /></SvgIcon>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 760 }}>Sign out of Playstack?</Typography>
              <Typography color="text.secondary" sx={{ fontSize: '.72rem', fontWeight: 400 }}>Please confirm before ending your session</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: '#fff6f6', borderLeft: '3px solid #d45a5a', borderRadius: 1.5, px: 1.5, py: 1.25 }}>
            <Typography sx={{ color: '#873737', fontSize: '.8rem', fontWeight: 650 }}>You will be returned to the login page.</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '.72rem', mt: .35 }}>Any unsaved changes on the current page will be lost.</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={() => setLogoutConfirmationOpen(false)} variant="outlined">Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setLogoutConfirmationOpen(false)
              onLogout()
            }}
            variant="contained"
          >
            Sign out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
