import { cacheDelete } from '../../config/cache.js'

export const DASHBOARD_STATS_CACHE_KEY = 'dashboard:stats:v1'
export const DASHBOARD_STATS_CACHE_TTL_SECONDS = 300

export const invalidateDashboardStats = () =>
  cacheDelete(DASHBOARD_STATS_CACHE_KEY)
