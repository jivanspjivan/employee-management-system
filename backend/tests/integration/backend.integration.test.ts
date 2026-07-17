import { randomUUID } from 'node:crypto'

import bcrypt from 'bcrypt'
import type { Express } from 'express'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { PrismaClient } from '../../src/generated/prisma/client.js'
import { EmployeeRole, EmployeeStatus } from '../../src/generated/prisma/enums.js'
import { signAccessToken } from '../../src/utils/jwt.js'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip

describeWithDatabase('backend PostgreSQL integration', () => {
  const marker = randomUUID().slice(0, 8)
  const departmentId = randomUUID()
  const adminId = randomUUID()
  const employeeId = randomUUID()
  let app: Express
  let prisma: PrismaClient
  let token: string

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl!
    process.env.JWT_SECRET = 'integration-test-jwt-secret-at-least-32-characters'
    process.env.JWT_EXPIRES_IN = '1h'
    process.env.NODE_ENV = 'test'

    const [{ createApp }, database] = await Promise.all([
      import('../../src/app.js'),
      import('../../src/config/database.js'),
    ])
    app = createApp()
    prisma = database.prisma

    await prisma.department.create({
      data: { id: departmentId, name: `Integration ${marker}` },
    })
    const passwordHash = await bcrypt.hash('integration-password', 4)
    await prisma.employee.createMany({
      data: [
        {
          id: adminId,
          employeeId: `INT-ADMIN-${marker}`,
          name: 'Integration Administrator',
          email: `integration-admin-${marker}@example.com`,
          passwordHash,
          departmentId,
          designation: 'Administrator',
          salary: 0,
          joiningDate: new Date('2026-01-01'),
          role: EmployeeRole.SUPER_ADMIN,
          status: EmployeeStatus.ACTIVE,
        },
        {
          id: employeeId,
          employeeId: `INT-EMP-${marker}`,
          name: 'Integration Employee',
          email: `integration-employee-${marker}@example.com`,
          passwordHash,
          departmentId,
          designation: 'Engineer',
          salary: 50000,
          joiningDate: new Date('2026-02-01'),
          role: EmployeeRole.EMPLOYEE,
          status: EmployeeStatus.ACTIVE,
        },
      ],
    })
    token = signAccessToken({
      employeeId: adminId,
      role: EmployeeRole.SUPER_ADMIN,
      tokenVersion: 0,
    })
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.employee.deleteMany({ where: { departmentId } })
    await prisma.department.deleteMany({ where: { id: departmentId } })
    await prisma.$disconnect()
  })

  it('lists real departments and dynamically filters employees', async () => {
    const departmentResponse = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${token}`)
    const employeeResponse = await request(app)
      .get('/api/employees')
      .query({ departmentId, role: 'EMPLOYEE', search: 'integration employee' })
      .set('Authorization', `Bearer ${token}`)

    expect(departmentResponse.status).toBe(200)
    expect(departmentResponse.body.data.departments).toContainEqual({
      id: departmentId,
      name: `Integration ${marker}`,
    })
    expect(employeeResponse.status).toBe(200)
    expect(employeeResponse.body.data.employees).toHaveLength(1)
    expect(employeeResponse.body.data.employees[0].id).toBe(employeeId)
  })

  it('persists manager assignments and rejects a database-backed reporting cycle', async () => {
    const firstAssignment = await request(app)
      .patch(`/api/employees/${adminId}/manager`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportingManagerId: employeeId })
    const circularAssignment = await request(app)
      .patch(`/api/employees/${employeeId}/manager`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportingManagerId: adminId })

    expect(firstAssignment.status).toBe(200)
    expect(circularAssignment.status).toBe(400)
    expect(circularAssignment.body.error.code).toBe('CIRCULAR_REPORTING')
  })
})
