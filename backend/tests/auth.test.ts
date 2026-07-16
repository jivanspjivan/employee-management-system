import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    employee: {
      findUnique: databaseMock.findUnique,
      updateMany: databaseMock.updateMany,
    },
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(
      async (password: string, hash: string) =>
        password === 'correct-password' && hash === 'stored-password-hash',
    ),
  },
}))

import { createApp } from '../src/app.js'

process.env.JWT_SECRET = 'test-jwt-secret-that-is-longer-than-32-characters'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'

const employeeRecord = {
  id: 'a85ccf20-fd8a-4f08-a14d-0ad92d57b1b9',
  employeeId: 'ADMIN-001',
  name: 'System Administrator',
  email: 'admin@example.com',
  phone: null,
  designation: 'System Administrator',
  salary: '0',
  joiningDate: new Date('2026-07-17'),
  status: 'ACTIVE',
  role: 'SUPER_ADMIN',
  profileImageUrl: null,
  departmentId: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
  reportingManagerId: null,
  createdAt: new Date('2026-07-17'),
  updatedAt: new Date('2026-07-17'),
  department: {
    id: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
    name: 'Administration',
  },
  passwordHash: 'stored-password-hash',
  isDeleted: false,
  tokenVersion: 0,
}

describe('authentication API', () => {
  beforeEach(() => {
    employeeRecord.status = 'ACTIVE'
    employeeRecord.isDeleted = false
    employeeRecord.tokenVersion = 0
    databaseMock.findUnique.mockReset()
    databaseMock.updateMany.mockReset()
    databaseMock.findUnique.mockImplementation(
      async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === employeeRecord.email || where.id === employeeRecord.id) {
          return { ...employeeRecord }
        }

        return null
      },
    )
    databaseMock.updateMany.mockImplementation(async () => {
      employeeRecord.tokenVersion += 1
      return { count: 1 }
    })
  })

  it('logs in with valid credentials without exposing the password hash', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'ADMIN@EXAMPLE.COM',
      password: 'correct-password',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.token).toEqual(expect.any(String))
    expect(response.body.data.employee).toMatchObject({
      employeeId: 'ADMIN-001',
      role: 'SUPER_ADMIN',
    })
    expect(response.body.data.employee).not.toHaveProperty('passwordHash')
  })

  it('rejects invalid credentials with a generic error', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'wrong-password',
    })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('validates the login request body', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'not-an-email',
      password: '',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns the authenticated employee from /me', async () => {
    const loginResponse = await request(createApp()).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'correct-password',
    })

    const response = await request(createApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.data.token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.employee.email).toBe('admin@example.com')
  })

  it('requires a Bearer token for protected endpoints', async () => {
    const response = await request(createApp()).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED')
  })

  it('invalidates the token after logout', async () => {
    const app = createApp()
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'correct-password',
    })
    const token = loginResponse.body.data.token as string

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)

    expect(logoutResponse.status).toBe(200)
    expect(employeeRecord.tokenVersion).toBe(1)

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(meResponse.status).toBe(401)
    expect(meResponse.body.error.code).toBe('INVALID_TOKEN')
  })
})
