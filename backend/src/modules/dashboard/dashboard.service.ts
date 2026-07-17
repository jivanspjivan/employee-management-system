import { prisma } from '../../config/database.js'
import { cacheGet, cacheSet } from '../../config/cache.js'
import { logger } from '../../config/logger.js'
import { EmployeeStatus } from '../../generated/prisma/enums.js'
import {
  DASHBOARD_STATS_CACHE_KEY,
  DASHBOARD_STATS_CACHE_TTL_SECONDS,
} from './dashboard.cache.js'

type DashboardStats = {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  departmentCount: number
}

export const getDashboardStats = async () => {
  const cachedStats = await cacheGet<DashboardStats>(DASHBOARD_STATS_CACHE_KEY)
  if (cachedStats) {
    logger.info('Dashboard statistics served from Redis cache', {
      cacheKey: DASHBOARD_STATS_CACHE_KEY,
    })
    return cachedStats
  }

  const [employeesByStatus, departmentCount] = await Promise.all([
    prisma.employee.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.department.count(),
  ])

  const statusCounts = new Map(
    employeesByStatus.map(({ status, _count }) => [status, _count._all]),
  )
  const activeEmployees = statusCounts.get(EmployeeStatus.ACTIVE) ?? 0
  const inactiveEmployees = statusCounts.get(EmployeeStatus.INACTIVE) ?? 0
  const totalEmployees = activeEmployees + inactiveEmployees

  const stats = {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    departmentCount,
  }

  await cacheSet(
    DASHBOARD_STATS_CACHE_KEY,
    stats,
    DASHBOARD_STATS_CACHE_TTL_SECONDS,
  )

  return stats
}
