import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { AppError } from './errors/app-error.js'
import { errorHandler } from './middleware/error-handler.js'
import { requestLogger } from './middleware/request-logger.js'
import { authRouter } from './modules/auth/auth.routes.js'

export const createApp = () => {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(requestLogger)
  app.use(
    cors({
      credentials: true,
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.status(200).json({
      message: 'Employee Management System API is running',
      status: 'ok',
    })
  })

  app.use('/api/auth', authRouter)

  app.use((_request, _response, next) => {
    next(new AppError(404, 'ROUTE_NOT_FOUND', 'Route not found'))
  })

  app.use(errorHandler)

  return app
}
