import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMock = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('../src/config/logger.js', () => ({ logger: loggerMock }))

import { requestLogger } from '../src/middleware/request-logger.js'

const createLoggingApp = () => {
  const app = express()
  app.use(requestLogger)
  app.get('/success', (_request, response) => response.sendStatus(200))
  app.get('/warning', (_request, response) => response.sendStatus(400))
  app.get('/error', (_request, response) => response.sendStatus(500))
  return app
}

describe('request logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs successful requests at info level', async () => {
    const response = await request(createLoggingApp()).get('/success')

    expect(response.headers['x-request-id']).toEqual(expect.any(String))
    expect(loggerMock.info).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ path: '/success', statusCode: 200 }),
    )
  })

  it('logs client failures at warn level', async () => {
    await request(createLoggingApp()).get('/warning')

    expect(loggerMock.warn).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ path: '/warning', statusCode: 400 }),
    )
  })

  it('logs server failures at error level', async () => {
    await request(createLoggingApp()).get('/error')

    expect(loggerMock.error).toHaveBeenCalledWith(
      'HTTP request completed',
      expect.objectContaining({ path: '/error', statusCode: 500 }),
    )
  })
})
