import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { EmployeeRole } from '../../generated/prisma/enums.js'
import * as authController from './auth.controller.js'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts. Try again later.',
    },
  },
})

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_RESET_REQUESTS', message: 'Too many reset requests. Try again later.' } },
})

export const authRouter = Router()

authRouter.post('/login', loginLimiter, authController.login)
authRouter.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword)
authRouter.post('/logout', authenticate, authController.logout)
authRouter.get('/me', authenticate, authController.me)
authRouter.get('/password-reset-requests', authenticate, authorize(EmployeeRole.SUPER_ADMIN), authController.listPasswordResetRequests)
authRouter.post('/password-reset-requests/:id/resolve', authenticate, authorize(EmployeeRole.SUPER_ADMIN), authController.resolvePasswordResetRequest)
