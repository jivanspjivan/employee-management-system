import { prisma } from '../../config/database.js'
import { cacheGet, cacheSet } from '../../config/cache.js'
import { logger } from '../../config/logger.js'
import { EmployeeStatus } from '../../generated/prisma/enums.js'
import {
  DASHBOARD_CHARTS_CACHE_KEY,
  DASHBOARD_CHARTS_CACHE_TTL_SECONDS,
  DASHBOARD_STATS_CACHE_KEY,
  DASHBOARD_STATS_CACHE_TTL_SECONDS,
} from './dashboard.cache.js'

type DashboardStats = {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  departmentCount: number
}

type JoiningTrendRow = {
  month: string
  count: number
}

type DashboardCharts = {
  statusDistribution: Array<{ status: EmployeeStatus; count: number }>
  roleDistribution: Array<{ role: string; count: number }>
  departmentDistribution: Array<{ departmentId: string; name: string; count: number }>
  joiningTrend: JoiningTrendRow[]
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

export const getDashboardCharts = async (): Promise<DashboardCharts> => {
  const cachedCharts = await cacheGet<DashboardCharts>(DASHBOARD_CHARTS_CACHE_KEY)
  if (cachedCharts) {
    logger.info('Dashboard charts served from Redis cache', {
      cacheKey: DASHBOARD_CHARTS_CACHE_KEY,
    })
    return cachedCharts
  }

  const [statuses, roles, departments, joiningTrend] = await Promise.all([
    prisma.employee.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.employee.groupBy({
      by: ['role'],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: { where: { isDeleted: false } } } },
      },
    }),
    prisma.$queryRaw<JoiningTrendRow[]>`
      SELECT
        TO_CHAR(months.month, 'YYYY-MM') AS month,
        COUNT(employees.id)::int AS count
      FROM GENERATE_SERIES(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS months(month)
      LEFT JOIN "employees" AS employees
        ON DATE_TRUNC('month', employees."joiningDate") = months.month
        AND employees."isDeleted" = false
      GROUP BY months.month
      ORDER BY months.month ASC
    `,
  ])

  const charts: DashboardCharts = {
    statusDistribution: statuses.map(({ status, _count }) => ({
      status,
      count: _count._all,
    })),
    roleDistribution: roles.map(({ role, _count }) => ({
      role,
      count: _count._all,
    })),
    departmentDistribution: departments.map(({ id, name, _count }) => ({
      departmentId: id,
      name,
      count: _count.employees,
    })),
    joiningTrend,
  }

  await cacheSet(
    DASHBOARD_CHARTS_CACHE_KEY,
    charts,
    DASHBOARD_CHARTS_CACHE_TTL_SECONDS,
  )

  return charts
}
