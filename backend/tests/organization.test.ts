import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    employee: {
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

const managerId = 'a85ccf20-fd8a-4f08-a14d-0ad92d57b1b9'
const reporteeId = '6bdd0aa2-a313-457f-82f5-f5c568a8fa4c'
const department = {
  id: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
  name: 'Engineering',
}
const authenticatedEmployee = {
  id: managerId,
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
  departmentId: department.id,
  reportingManagerId: null,
  createdAt: new Date('2026-07-17'),
  updatedAt: new Date('2026-07-17'),
  department,
  isDeleted: false,
  tokenVersion: 0,
}

const token = signAccessToken({
  employeeId: managerId,
  role: EmployeeRole.SUPER_ADMIN,
  tokenVersion: 0,
})

describe('organization tree API', () => {
  beforeEach(() => {
    databaseMock.findMany.mockReset()
    databaseMock.findUnique.mockReset()
    databaseMock.findUnique.mockResolvedValue({ ...authenticatedEmployee })
    databaseMock.findMany.mockResolvedValue([
      {
        id: managerId,
        employeeId: 'ADMIN-001',
        name: 'System Administrator',
        designation: 'System Administrator',
        role: EmployeeRole.SUPER_ADMIN,
        status: 'ACTIVE',
        profileImageUrl: null,
        reportingManagerId: null,
        department,
      },
      {
        id: reporteeId,
        employeeId: 'EMP-002',
        name: 'Asha Sharma',
        designation: 'Software Engineer',
        role: EmployeeRole.EMPLOYEE,
        status: 'ACTIVE',
        profileImageUrl: null,
        reportingManagerId: managerId,
        department,
      },
    ])
  })

  it('returns employees as a nested reporting tree', async () => {
    const response = await request(createApp())
      .get('/api/organization/tree')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.tree).toHaveLength(1)
    expect(response.body.data.tree[0]).toMatchObject({
      id: managerId,
      directReports: [{ id: reporteeId, directReports: [] }],
    })
    expect(databaseMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDeleted: false } }),
    )
  })

  it('requires authentication', async () => {
    const response = await request(createApp()).get('/api/organization/tree')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
    expect(databaseMock.findMany).not.toHaveBeenCalled()
  })
})
