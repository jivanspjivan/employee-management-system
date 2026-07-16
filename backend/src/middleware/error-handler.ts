import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { logger } from '../config/logger.js'
import { AppError } from '../errors/app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    const log = error.statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger)
    log('API request failed', {
      requestId: request.requestId,
      method: request.method,
      path: request.path,
      statusCode: error.statusCode,
      errorCode: error.code,
      ...(error.statusCode >= 500 ? { stack: error.stack } : {}),
    })

    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    })
    return
  }

  if (error instanceof ZodError) {
    logger.warn('Request validation failed', {
      requestId: request.requestId,
      method: request.method,
      path: request.path,
      fields: error.issues.map((issue) => issue.path.join('.')),
    })

    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
    return
  }

  logger.error('Unhandled API error', {
    requestId: request.requestId,
    method: request.method,
    path: request.path,
    error:
      error instanceof Error
        ? { message: error.message, name: error.name, stack: error.stack }
        : { message: 'Unknown error type' },
  })
  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  })
}
