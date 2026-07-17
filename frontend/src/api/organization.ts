import { apiRequest } from './client'
import type { OrganizationTreeNode } from './types'

export const getOrganizationTreeRequest = (signal?: AbortSignal) =>
  apiRequest<{ data: { tree: OrganizationTreeNode[] } }>('/organization/tree', { signal })
