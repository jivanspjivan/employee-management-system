import type { RequestHandler } from 'express'

import { AppError } from '../../errors/app-error.js'
import { forgotPasswordSchema, loginSchema, passwordResetRequestParamSchema } from './auth.schema.js'
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

export const me: RequestHandler = async (request, response) => {
  if (!request.employee) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
  }

  const employee = await authService.getCurrentEmployee(request.employee.id)
  response.status(200).json({ data: { employee } })
}

export const forgotPassword: RequestHandler = async (request, response) => {
  const input = forgotPasswordSchema.parse(request.body)
  await authService.requestPasswordReset(input)
  response.status(202).json({ message: 'If an active account matches that email, an administrator will receive the request.' })
}

export const listPasswordResetRequests: RequestHandler = async (_request, response) => {
  const requests = await authService.listPasswordResetRequests()
  response.status(200).json({ data: { requests } })
}

export const resolvePasswordResetRequest: RequestHandler = async (request, response) => {
  const { id } = passwordResetRequestParamSchema.parse(request.params)
  const result = await authService.resolvePasswordResetRequest(id)
  response.status(200).json({ message: 'Temporary password generated', data: result })
}
