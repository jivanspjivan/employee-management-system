import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
  count: vi.fn(),
  create: vi.fn(),
  departmentFindUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../src/config/database.js', () => ({
  prisma: {
    department: {
      findUnique: databaseMock.departmentFindUnique,
    },
    employee: {
      count: databaseMock.count,
      create: databaseMock.create,
      findFirst: databaseMock.findFirst,
      findMany: databaseMock.findMany,
      findUnique: databaseMock.findUnique,
      update: databaseMock.update,
    },
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(async () => 'new-password-hash'),
  },
}))

import { createApp } from '../src/app.js'
import { Prisma } from '../src/generated/prisma/client.js'
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
    databaseMock.count.mockReset()
    databaseMock.findFirst.mockReset()
    databaseMock.findMany.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findMany.mockResolvedValue([listedEmployee])
    databaseMock.count.mockResolvedValue(1)
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
      expect.objectContaining({
        where: { isDeleted: false },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 10,
      }),
    )
    expect(response.body.data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })

  it('combines optional search, filters, sorting, and pagination', async () => {
    databaseMock.count.mockResolvedValue(23)

    const response = await request(createApp())
      .get('/api/employees')
      .query({
        search: 'asha',
        departmentId: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
        role: 'employee',
        status: 'active',
        sortBy: 'joiningDate',
        sortOrder: 'desc',
        page: 2,
        limit: 5,
      })
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(databaseMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isDeleted: false,
          departmentId: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
          role: EmployeeRole.EMPLOYEE,
          status: 'ACTIVE',
          OR: [
            { name: { contains: 'asha', mode: 'insensitive' } },
            { email: { contains: 'asha', mode: 'insensitive' } },
          ],
        },
        orderBy: { joiningDate: 'desc' },
        skip: 5,
        take: 5,
      }),
    )
    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 23,
      totalPages: 5,
    })
  })

  it('rejects invalid list query parameters', async () => {
    const response = await request(createApp())
      .get('/api/employees')
      .query({ sortBy: 'salary', page: 0, limit: 101 })
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(databaseMock.findMany).not.toHaveBeenCalled()
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

describe('direct reportees API', () => {
  beforeEach(() => {
    databaseMock.findFirst.mockReset()
    databaseMock.findMany.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockResolvedValue({ ...authenticatedEmployee })
    databaseMock.findFirst.mockResolvedValue(listedEmployee)
    databaseMock.findMany.mockResolvedValue([
      {
        ...listedEmployee,
        id: '6bdd0aa2-a313-457f-82f5-f5c568a8fa4c',
        reportingManagerId: authenticatedEmployee.id,
      },
    ])
  })

  it('returns an employee direct reportees', async () => {
    const response = await request(createApp())
      .get(`/api/employees/${authenticatedEmployee.id}/reportees`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.data.reportees).toHaveLength(1)
    expect(databaseMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reportingManagerId: authenticatedEmployee.id, isDeleted: false },
        orderBy: { name: 'asc' },
      }),
    )
  })

  it('returns 404 when the selected manager does not exist', async () => {
    databaseMock.findFirst.mockResolvedValue(null)

    const response = await request(createApp())
      .get('/api/employees/6bdd0aa2-a313-457f-82f5-f5c568a8fa4c/reportees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('EMPLOYEE_NOT_FOUND')
    expect(databaseMock.findMany).not.toHaveBeenCalled()
  })
})

describe('create employee API', () => {
  const input = {
    employeeId: 'EMP-002',
    name: 'Asha Sharma',
    email: 'ASHA@EXAMPLE.COM',
    password: 'temporary-password',
    phone: '+91 9876543210',
    departmentId: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
    designation: 'Software Engineer',
    salary: 75000,
    joiningDate: '2026-07-18',
    role: EmployeeRole.EMPLOYEE,
  }

  beforeEach(() => {
    databaseMock.create.mockReset()
    databaseMock.departmentFindUnique.mockReset()
    databaseMock.findFirst.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findFirst.mockResolvedValue(null)
    databaseMock.departmentFindUnique.mockResolvedValue({ id: input.departmentId })
    databaseMock.create.mockResolvedValue({
      ...listedEmployee,
      employeeId: input.employeeId,
      name: input.name,
      email: input.email.toLowerCase(),
    })
  })

  it('allows a Super Admin to create an employee', async () => {
    const response = await request(createApp())
      .post('/api/employees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send(input)

    expect(response.status).toBe(201)
    expect(response.body.data.employee).toMatchObject({
      employeeId: 'EMP-002',
      email: 'asha@example.com',
    })
    expect(databaseMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'asha@example.com',
          passwordHash: 'new-password-hash',
        }),
      }),
    )
    expect(databaseMock.create.mock.calls[0]![0].data).not.toHaveProperty('password')
  })

  it('prevents an HR Manager from assigning the Super Admin role', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER

    const response = await request(createApp())
      .post('/api/employees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)
      .send({ ...input, role: EmployeeRole.SUPER_ADMIN })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.create).not.toHaveBeenCalled()
  })

  it('rejects invalid employee data', async () => {
    const response = await request(createApp())
      .post('/api/employees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ ...input, email: 'invalid-email', salary: -1 })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(databaseMock.create).not.toHaveBeenCalled()
  })
})

describe('update employee API', () => {
  beforeEach(() => {
    databaseMock.findFirst.mockReset()
    databaseMock.findUnique.mockReset()
    databaseMock.update.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findFirst.mockResolvedValue({ id: authenticatedEmployee.id })
    databaseMock.update.mockResolvedValue({
      ...listedEmployee,
      designation: 'Senior Software Engineer',
    })
  })

  it('allows a Super Admin to update an employee', async () => {
    const response = await request(createApp())
      .put(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ designation: 'Senior Software Engineer', salary: 90000 })

    expect(response.status).toBe(200)
    expect(response.body.data.employee.designation).toBe('Senior Software Engineer')
    expect(databaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: authenticatedEmployee.id },
        data: { designation: 'Senior Software Engineer', salary: 90000 },
      }),
    )
  })

  it('allows an Employee to update their own limited profile fields', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE
    databaseMock.update.mockResolvedValue({
      ...listedEmployee,
      name: 'Updated Employee Name',
    })

    const response = await request(createApp())
      .put(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)
      .send({ name: 'Updated Employee Name' })

    expect(response.status).toBe(200)
    expect(databaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Updated Employee Name' } }),
    )
  })

  it('rejects restricted fields when an Employee updates their profile', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .put(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)
      .send({ salary: 100000 })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FIELD_EDIT_NOT_ALLOWED')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('prevents an HR Manager from assigning the Super Admin role', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER

    const response = await request(createApp())
      .put(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)
      .send({ role: EmployeeRole.SUPER_ADMIN })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('prevents an HR Manager from modifying an existing Super Admin', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER
    databaseMock.findFirst.mockResolvedValue({
      id: authenticatedEmployee.id,
      role: EmployeeRole.SUPER_ADMIN,
      status: 'ACTIVE',
    })

    const response = await request(createApp())
      .put(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)
      .send({ designation: 'Changed by HR' })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('prevents an administrator from changing their own role', async () => {
    databaseMock.findFirst.mockResolvedValue({
      id: authenticatedEmployee.id,
      role: EmployeeRole.SUPER_ADMIN,
      status: 'ACTIVE',
    })

    const response = await request(createApp())
      .put(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ role: EmployeeRole.HR_MANAGER })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('CANNOT_CHANGE_OWN_ROLE')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('protects the last active Super Admin from demotion', async () => {
    const otherSuperAdminId = '6bdd0aa2-a313-457f-82f5-f5c568a8fa4c'
    databaseMock.findFirst.mockResolvedValue({
      id: otherSuperAdminId,
      role: EmployeeRole.SUPER_ADMIN,
      status: 'ACTIVE',
    })
    databaseMock.count.mockResolvedValue(1)

    const response = await request(createApp())
      .put(`/api/employees/${otherSuperAdminId}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ role: EmployeeRole.EMPLOYEE })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('LAST_SUPER_ADMIN_REQUIRED')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })
})

describe('database constraint error handling', () => {
  beforeEach(() => {
    databaseMock.create.mockReset()
    databaseMock.departmentFindUnique.mockReset()
    databaseMock.findFirst.mockReset()
    databaseMock.findUnique.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockResolvedValue({ ...authenticatedEmployee })
    databaseMock.findFirst.mockResolvedValue(null)
    databaseMock.departmentFindUnique.mockResolvedValue({
      id: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
    })
  })

  it('maps a concurrent unique constraint failure to a conflict response', async () => {
    databaseMock.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.8.0',
        meta: { target: ['email'] },
      }),
    )

    const response = await request(createApp())
      .post('/api/employees')
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({
        employeeId: 'EMP-002',
        name: 'Asha Sharma',
        email: 'asha@example.com',
        password: 'temporary-password',
        departmentId: 'd4266f98-1abc-49e6-9659-e0bd86e1fa7f',
        designation: 'Software Engineer',
        salary: 75000,
        joiningDate: '2026-07-18',
      })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('EMPLOYEE_ALREADY_EXISTS')
    expect(response.body.error.details.fields).toEqual(['email'])
  })
})

describe('delete employee API', () => {
  const employeeToDeleteId = '6bdd0aa2-a313-457f-82f5-f5c568a8fa4c'

  beforeEach(() => {
    databaseMock.findFirst.mockReset()
    databaseMock.findUnique.mockReset()
    databaseMock.update.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findFirst.mockResolvedValue({ id: employeeToDeleteId })
    databaseMock.update.mockResolvedValue({
      id: employeeToDeleteId,
      employeeId: 'EMP-002',
      name: 'Asha Sharma',
      deletedAt: new Date('2026-07-18'),
    })
  })

  it('allows a Super Admin to soft-delete an employee', async () => {
    const response = await request(createApp())
      .delete(`/api/employees/${employeeToDeleteId}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Employee deleted successfully')
    expect(databaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: employeeToDeleteId },
        data: expect.objectContaining({
          isDeleted: true,
          status: 'INACTIVE',
          tokenVersion: { increment: 1 },
        }),
      }),
    )
  })

  it('prevents an HR Manager from deleting an employee', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER

    const response = await request(createApp())
      .delete(`/api/employees/${employeeToDeleteId}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('prevents a Super Admin from deleting their own account', async () => {
    const response = await request(createApp())
      .delete(`/api/employees/${authenticatedEmployee.id}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('CANNOT_DELETE_SELF')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the employee is already deleted or missing', async () => {
    databaseMock.findFirst.mockResolvedValue(null)

    const response = await request(createApp())
      .delete(`/api/employees/${employeeToDeleteId}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('EMPLOYEE_NOT_FOUND')
  })

  it('protects the last active Super Admin from deletion', async () => {
    databaseMock.findFirst.mockResolvedValue({
      id: employeeToDeleteId,
      role: EmployeeRole.SUPER_ADMIN,
      status: 'ACTIVE',
    })
    databaseMock.count.mockResolvedValue(1)

    const response = await request(createApp())
      .delete(`/api/employees/${employeeToDeleteId}`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('LAST_SUPER_ADMIN_REQUIRED')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })
})

describe('assign reporting manager API', () => {
  const employeeId = '6bdd0aa2-a313-457f-82f5-f5c568a8fa4c'
  const managerId = '51b3dfb6-7c06-4540-8f45-b65be389ef27'

  beforeEach(() => {
    databaseMock.findFirst.mockReset()
    databaseMock.findUnique.mockReset()
    databaseMock.update.mockReset()
    authenticatedEmployee.role = EmployeeRole.SUPER_ADMIN
    databaseMock.findUnique.mockImplementation(async () => ({ ...authenticatedEmployee }))
    databaseMock.findFirst.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === employeeId) {
        return { id: employeeId, reportingManagerId: null }
      }

      if (where.id === managerId) {
        return { id: managerId, reportingManagerId: null }
      }

      return null
    })
    databaseMock.update.mockResolvedValue({
      ...listedEmployee,
      id: employeeId,
      reportingManagerId: managerId,
      reportingManager: {
        id: managerId,
        employeeId: 'MGR-001',
        name: 'Reporting Manager',
      },
    })
  })

  it('allows a Super Admin to assign a reporting manager', async () => {
    const response = await request(createApp())
      .patch(`/api/employees/${employeeId}/manager`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ reportingManagerId: managerId })

    expect(response.status).toBe(200)
    expect(response.body.data.employee.reportingManagerId).toBe(managerId)
    expect(databaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: employeeId },
        data: { reportingManagerId: managerId },
      }),
    )
  })

  it('allows an HR Manager to remove a reporting manager', async () => {
    authenticatedEmployee.role = EmployeeRole.HR_MANAGER
    databaseMock.update.mockResolvedValue({
      ...listedEmployee,
      id: employeeId,
      reportingManagerId: null,
      reportingManager: null,
    })

    const response = await request(createApp())
      .patch(`/api/employees/${employeeId}/manager`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.HR_MANAGER)}`)
      .send({ reportingManagerId: null })

    expect(response.status).toBe(200)
    expect(response.body.data.employee.reportingManagerId).toBeNull()
  })

  it('prevents an Employee from assigning a manager', async () => {
    authenticatedEmployee.role = EmployeeRole.EMPLOYEE

    const response = await request(createApp())
      .patch(`/api/employees/${employeeId}/manager`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.EMPLOYEE)}`)
      .send({ reportingManagerId: managerId })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('prevents an employee from reporting to themselves', async () => {
    const response = await request(createApp())
      .patch(`/api/employees/${employeeId}/manager`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ reportingManagerId: employeeId })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('CIRCULAR_REPORTING')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('prevents a circular reporting chain', async () => {
    databaseMock.findFirst.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === employeeId) {
        return { id: employeeId, reportingManagerId: null }
      }

      if (where.id === managerId) {
        return { id: managerId, reportingManagerId: employeeId }
      }

      return null
    })

    const response = await request(createApp())
      .patch(`/api/employees/${employeeId}/manager`)
      .set('Authorization', `Bearer ${createToken(EmployeeRole.SUPER_ADMIN)}`)
      .send({ reportingManagerId: managerId })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('CIRCULAR_REPORTING')
    expect(databaseMock.update).not.toHaveBeenCalled()
  })
})
