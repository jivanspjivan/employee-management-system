import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  departmentCount: vi.fn(),
  departmentFindMany: vi.fn(),
  employeeGroupBy: vi.fn(),
  findUnique: vi.fn(),
  queryRaw: vi.fn(),
}))

const cacheMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

vi.mock('../src/config/cache.js', () => ({
  cacheGet: cacheMock.get,
  cacheSet: cacheMock.set,
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    $queryRaw: databaseMock.queryRaw,
    department: {
      count: databaseMock.departmentCount,
      findMany: databaseMock.departmentFindMany,
    },
    employee: {
      groupBy: databaseMock.employeeGroupBy,
      findUnique: databaseMock.findUnique,
    },
  },
}))

import { createApp } from '../src/app.js'
import { EmployeeRole, EmployeeStatus } from '../src/generated/prisma/enums.js'
import { signAccessToken } from '../src/utils/jwt.js'

process.env.JWT_SECRET = 'test-jwt-secret-that-is-longer-than-32-characters'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'

const authenticatedEmployee = {
  id: 'a85ccf20-fd8a-4f08-a14d-0ad92d57b1b9',
  employeeId: 'ADMIN-001',
  name: 'System Administrator',
  email: 'admin@example.com',
  phone: null,
  designation: 'System Administrator',
  salary: '0',
  joiningDate: new Date('2026-07-17'),
  status: EmployeeStatus.ACTIVE,
  role: EmployeeRole.SUPER_ADMIN as EmployeeRole,
  profileImageUrl: null,
  departmentId: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
  reportingManagerId: null,
  createdAt: new Date('2026-07-17'),
  updatedAt: new Date('2026-07-17'),
  department: {
    id: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
    name: 'Administration',
  },
  isDeleted: false,
  tokenVersion: 0,
}

const createToken = (role: EmployeeRole) =>
  signAccessToken({
    employeeId: authenticatedEmployee.id,
    role,
    tokenVersion: authenticatedEmployee.tokenVersion,
  })

describe('dashboard statistics API', () => {
  beforeEach(() => {
    databaseMock.departmentCount.mockReset()
    databaseMock.departmentFindMany.mockReset()
    databaseMock.employeeGroupBy.mockReset()
    databaseMock.findUnique.mockReset()
    databaseMock.queryRaw.mockReset()
    cacheMock.get.mockReset().mockResolvedValue(null)
    cacheMock.set.mockReset().mockResolvedValue(undefined)
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.employeeGroupBy.mockImplementation(async ({ by }: { by: string[] }) =>
      by.includes('role')
        ? [
            { role: EmployeeRole.EMPLOYEE, _count: { _all: 9 } },
            { role: EmployeeRole.HR_MANAGER, _count: { _all: 2 } },
            { role: EmployeeRole.SUPER_ADMIN, _count: { _all: 1 } },
          ]
        : [
            { status: EmployeeStatus.ACTIVE, _count: { _all: 9 } },
            { status: EmployeeStatus.INACTIVE, _count: { _all: 3 } },
          ],
    )
    databaseMock.departmentCount.mockResolvedValue(4)
    databaseMock.departmentFindMany.mockResolvedValue([
      { id: 'department-1', name: 'Engineering', _count: { employees: 7 } },
      { id: 'department-2', name: 'People', _count: { employees: 5 } },
    ])
    databaseMock.queryRaw.mockResolvedValue([
      { month: '2026-06', count: 2 },
      { month: '2026-07', count: 3 },
    ])
  })

  it('returns employee and department counts to a Super Admin', async () => {
    const response = await request(createApp())
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.data.stats).toEqual({
      totalEmployees: 12,
      activeEmployees: 9,
      inactiveEmployees: 3,
      departmentCount: 4,
    })
    expect(databaseMock.employeeGroupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: { isDeleted: false },
      _count: { _all: true },
    })
    expect(cacheMock.set).toHaveBeenCalledWith(
      'dashboard:stats:v1',
      response.body.data.stats,
      300,
    )
  })

  it('returns cached statistics without querying the database', async () => {
    const cachedStats = {
      totalEmployees: 20,
      activeEmployees: 17,
      inactiveEmployees: 3,
      departmentCount: 6,
    }
    cacheMock.get.mockImplementation(async (key: string) =>
      key === 'dashboard:stats:v1' ? cachedStats : null,
    )

    const response = await request(createApp())
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.data.stats).toEqual(cachedStats)
    expect(databaseMock.employeeGroupBy).not.toHaveBeenCalled()
    expect(databaseMock.departmentCount).not.toHaveBeenCalled()
    expect(cacheMock.set).not.toHaveBeenCalledWith(
      'dashboard:stats:v1',
      expect.anything(),
      expect.anything(),
    )
  })

  it('allows an HR Manager to view dashboard statistics', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER

    const response = await request(createApp())
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)

    expect(response.status).toBe(200)
  })

  it('returns aggregated workforce chart data', async () => {
    const response = await request(createApp())
      .get('/api/dashboard/charts')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.data.charts).toEqual({
      statusDistribution: [
        { status: EmployeeStatus.ACTIVE, count: 9 },
        { status: EmployeeStatus.INACTIVE, count: 3 },
      ],
      roleDistribution: [
        { role: EmployeeRole.EMPLOYEE, count: 9 },
        { role: EmployeeRole.HR_MANAGER, count: 2 },
        { role: EmployeeRole.SUPER_ADMIN, count: 1 },
      ],
      departmentDistribution: [
        { departmentId: 'department-1', name: 'Engineering', count: 7 },
        { departmentId: 'department-2', name: 'People', count: 5 },
      ],
      joiningTrend: [
        { month: '2026-06', count: 2 },
        { month: '2026-07', count: 3 },
      ],
    })
    expect(cacheMock.set).toHaveBeenCalledWith(
      'dashboard:charts:v1',
      response.body.data.charts,
      300,
    )
  })

  it('prevents an Employee from viewing organization-wide statistics', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.employeeGroupBy).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await request(createApp()).get('/api/dashboard/stats')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
    expect(databaseMock.employeeGroupBy).not.toHaveBeenCalled()
  })
})
