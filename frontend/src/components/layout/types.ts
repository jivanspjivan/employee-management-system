import type { ReactNode } from 'react'

export type AppNavItem<Role extends string = string> = {
  label: string
  path: string
  icon?: ReactNode
  roles?: readonly Role[]
}

export type AppShellUser<Role extends string = string> = {
  name: string
  email?: string
  role: Role
  avatarUrl?: string | null
}

export type AppShellProps<Role extends string = string> = {
  children: ReactNode
  navigation: readonly AppNavItem<Role>[]
  user: AppShellUser<Role>
  activePath: string
  onNavigate: (path: string) => void
  onLogout: () => void
  title?: string
  brand?: string
}
