import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { logger } from '../config/logger.js'
import { AppError } from '../errors/app-error.js'
import { Prisma } from '../generated/prisma/client.js'

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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({
        error: {
          code: 'EMPLOYEE_ALREADY_EXISTS',
          message: 'An employee with this employee ID or email already exists',
          details: { fields: error.meta?.target },
        },
      })
      return
    }

    if (error.code === 'P2003') {
      response.status(400).json({
        error: {
          code: 'INVALID_REFERENCE',
          message: 'A referenced record does not exist',
          details: { field: error.meta?.field_name },
        },
      })
      return
    }

    if (error.code === 'P2025') {
      response.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested record does not exist',
        },
      })
      return
    }
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
