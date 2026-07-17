import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  departmentCount: vi.fn(),
  employeeCount: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    department: { count: databaseMock.departmentCount },
    employee: {
      count: databaseMock.employeeCount,
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
    databaseMock.employeeCount.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.employeeCount
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(3)
    databaseMock.departmentCount.mockResolvedValue(4)
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
    expect(databaseMock.employeeCount).toHaveBeenNthCalledWith(1, {
      where: { isDeleted: false },
    })
    expect(databaseMock.employeeCount).toHaveBeenNthCalledWith(2, {
      where: { isDeleted: false, status: EmployeeStatus.ACTIVE },
    })
    expect(databaseMock.employeeCount).toHaveBeenNthCalledWith(3, {
      where: { isDeleted: false, status: EmployeeStatus.INACTIVE },
    })
  })

  it('allows an HR Manager to view dashboard statistics', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER

    const response = await request(createApp())
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)

    expect(response.status).toBe(200)
  })

  it('prevents an Employee from viewing organization-wide statistics', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.employeeCount).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await request(createApp()).get('/api/dashboard/stats')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
    expect(databaseMock.employeeCount).not.toHaveBeenCalled()
  })
})
