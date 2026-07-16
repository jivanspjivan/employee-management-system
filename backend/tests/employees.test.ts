import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    employee: {
      findFirst: databaseMock.findFirst,
      findMany: databaseMock.findMany,
      findUnique: databaseMock.findUnique,
    },
  },
}))

import { createApp } from '../src/app.js'
import { EmployeeRole } from '../src/generated/prisma/enums.js'
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
  status: 'ACTIVE',
  role: EmployeeRole.SUPER_ADMIN,
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

const listedEmployee = {
  ...authenticatedEmployee,
  reportingManager: null,
}

const createToken = (role: EmployeeRole) =>
  signAccessToken({
    employeeId: authenticatedEmployee.id,
    role,
    tokenVersion: authenticatedEmployee.tokenVersion,
  })

describe('employee list API', () => {
  beforeEach(() => {
    databaseMock.findFirst.mockReset()
    databaseMock.findMany.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findMany.mockResolvedValue([listedEmployee])
    databaseMock.findFirst.mockResolvedValue(listedEmployee)
  })

  it('allows a Super Admin to list non-deleted employees', async () => {
    const response = await request(createApp())
      .get('/api/employees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.data.employees).toHaveLength(1)
    expect(response.body.data.employees[0]).toMatchObject({ employeeId: 'ADMIN-001' })
    expect(response.body.data.employees[0]).not.toHaveProperty('passwordHash')
    expect(databaseMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDeleted: false } }),
    )
  })

  it('rejects an Employee role', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .get('/api/employees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.findMany).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await request(createApp()).get('/api/employees')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
    expect(databaseMock.findMany).not.toHaveBeenCalled()
  })
})

describe('employee detail API', () => {
  beforeEach(() => {
    databaseMock.findFirst.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findFirst.mockResolvedValue(listedEmployee)
  })

  it('allows a Super Admin to view an employee', async () => {
    const response = await request(createApp())
      .get(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.data.employee.employeeId).toBe('ADMIN-001')
    expect(databaseMock.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: authenticatedEmployee.id, isDeleted: false },
      }),
    )
  })

  it('allows an Employee to view their own profile', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .get(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)

    expect(response.status).toBe(200)
  })

  it('prevents an Employee from viewing another employee', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .get('/api/employees/6bdd0aa2-a313-457f-82f5-f5c568a8fa4c')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.findFirst).not.toHaveBeenCalled()
  })

  it('returns 404 when the employee does not exist', async () => {
    databaseMock.findFirst.mockResolvedValue(null)

    const response = await request(createApp())
      .get('/api/employees/6bdd0aa2-a313-457f-82f5-f5c568a8fa4c')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('EMPLOYEE_NOT_FOUND')
  })
})
