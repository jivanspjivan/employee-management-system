import { randomUUID } from 'node:crypto'

import type { RequestHandler } from 'express'

import { logger } from '../config/logger.js'

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint()
  const requestId = randomUUID()

  request.requestId = requestId
  response.setHeader('X-Request-Id', requestId)

  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const metadata = {
      requestId,
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ...(request.employee ? { employeeId: request.employee.id } : {}),
    }

    if (response.statusCode >= 500) {
      logger.error('HTTP request completed', metadata)
      return
    }

    if (response.statusCode >= 400) {
      logger.warn('HTTP request completed', metadata)
      return
    }

    logger.info('HTTP request completed', metadata)
  })

  next()
}
