import type { RequestHandler } from 'express'

import { AppError } from '../../errors/app-error.js'
import { loginSchema } from './auth.schema.js'
import * as authService from './auth.service.js'

export const login: RequestHandler = async (request, response) => {
  const input = loginSchema.parse(request.body)
  const data = await authService.login(input)

  response.status(200).json({
    message: 'Login successful',
    data,
  })
}

export const logout: RequestHandler = async (request, response) => {
  if (!request.employee || request.authTokenVersion === undefined) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  await authService.logout(request.employee.id, request.authTokenVersion)

  response.status(200).json({ message: 'Logout successful' })
}

export const me: RequestHandler = (request, response) => {
  if (!request.employee) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  response.status(200).json({ data: { employee: request.employee } })
}
