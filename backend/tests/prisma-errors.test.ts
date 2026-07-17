import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { Prisma } from '../src/generated/prisma/client.js'
import { errorHandler } from '../src/middleware/error-handler.js'

const createErrorApp = (error: Error) => {
  const app = express()
  app.get('/failure', () => {
    throw error
  })
  app.use(errorHandler)
  return app
}

const prismaError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('Database request failed', {
    code,
    clientVersion: '7.8.0',
    meta,
  })

describe('Prisma error responses', () => {
  it('maps unique constraints to a conflict', async () => {
    const response = await request(
      createErrorApp(prismaError('P2002', { target: ['employeeId'] })),
    ).get('/failure')

    expect(response.status).toBe(409)
    expect(response.body.error).toMatchObject({
      code: 'EMPLOYEE_ALREADY_EXISTS',
      details: { fields: ['employeeId'] },
    })
  })

  it('maps foreign-key constraints to an invalid reference', async () => {
    const response = await request(
      createErrorApp(prismaError('P2003', { field_name: 'departmentId' })),
    ).get('/failure')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({
      code: 'INVALID_REFERENCE',
      details: { field: 'departmentId' },
    })
  })

  it('maps missing records to a not-found response', async () => {
    const response = await request(createErrorApp(prismaError('P2025'))).get('/failure')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })
})
