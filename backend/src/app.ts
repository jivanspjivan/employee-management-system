import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'

export const createApp = () => {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
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

  app.use((_request, response) => {
    response.status(404).json({ message: 'Route not found' })
  })

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      console.error(error)
      response.status(500).json({ message: 'Internal server error' })
    },
  )

  return app
}
