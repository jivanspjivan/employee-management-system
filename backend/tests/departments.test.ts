import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  departmentCreate: vi.fn(),
  departmentFindMany: vi.fn(),
  employeeFindUnique: vi.fn(),
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    department: { create: databaseMock.departmentCreate, findMany: databaseMock.departmentFindMany },
    employee: { findUnique: databaseMock.employeeFindUnique },
  },
}))

import { createApp } from '../src/app.js'
import { EmployeeRole, EmployeeStatus } from '../src/generated/prisma/enums.js'
import { signAccessToken } from '../src/utils/jwt.js'

process.env.JWT_SECRET = 'test-jwt-secret-that-is-longer-than-32-characters'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'

const employee = {
  id: 'a85ccf20-fd8a-4f08-a14d-0ad92d57b1b9',
  employeeId: 'ADMIN-001',
  name: 'System Administrator',
  email: 'admin@example.com',
  phone: null,
  designation: 'System Administrator',
  salary: '0',
  joiningDate: new Date('2026-07-17'),
  status: EmployeeStatus.ACTIVE,
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
const token = signAccessToken({
  employeeId: employee.id,
  role: employee.role,
  tokenVersion: employee.tokenVersion,
})

describe('department list API', () => {
  beforeEach(() => {
    databaseMock.departmentFindMany.mockReset()
    databaseMock.employeeFindUnique.mockReset()
    databaseMock.employeeFindUnique.mockResolvedValue({ ...employee })
    databaseMock.departmentFindMany.mockResolvedValue([
      { _count: { employees: 12 }, id: employee.department.id, name: employee.department.name },
    ])
  })

  it('returns departments alphabetically to an authenticated employee', async () => {
    const response = await request(createApp())
      .get('/api/departments')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.departments).toEqual([
      { employeeCount: 12, id: employee.department.id, name: 'Administration' },
    ])
    expect(databaseMock.departmentFindMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: {
        _count: { select: { employees: { where: { isDeleted: false } } } },
        id: true,
        name: true,
      },
    })
  })

  it('allows an HR Manager to create a department', async () => {
    const hrToken = signAccessToken({ employeeId: employee.id, role: EmployeeRole.HR_MANAGER, tokenVersion: 0 })
    databaseMock.departmentCreate.mockResolvedValue({ id: employee.department.id, name: 'People Operations' })

    const response = await request(createApp())
      .post('/api/departments')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ name: 'People Operations' })

    expect(response.status).toBe(201)
    expect(response.body.data.department.name).toBe('People Operations')
    expect(databaseMock.departmentCreate).toHaveBeenCalledWith({
      data: { name: 'People Operations' },
      select: { id: true, name: true },
    })
  })

  it('requires authentication', async () => {
    const response = await request(createApp()).get('/api/departments')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
    expect(databaseMock.departmentFindMany).not.toHaveBeenCalled()
  })
})
