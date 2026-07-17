import { cacheDelete, cacheGet, cacheSet } from '../../config/cache.js'
import { logger } from '../../config/logger.js'
import type { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'

export type CachedAuthState = {
  id: string
  role: EmployeeRole
  status: EmployeeStatus
  isDeleted: boolean
  tokenVersion: number
}

const AUTH_CACHE_TTL_SECONDS = Number(process.env.AUTH_CACHE_TTL_SECONDS ?? 30)
const authCacheKey = (employeeId: string) => `auth:employee:${employeeId}`

export const getCachedAuthState = async (employeeId: string) => {
  const state = await cacheGet<CachedAuthState>(authCacheKey(employeeId))
  if (state) {
    logger.info('Authentication state served from Redis cache', { employeeId })
  }
  return state
}

export const cacheAuthState = (state: CachedAuthState) =>
  cacheSet(authCacheKey(state.id), state, AUTH_CACHE_TTL_SECONDS)

export const invalidateAuthState = (employeeId: string) =>
  cacheDelete(authCacheKey(employeeId))
