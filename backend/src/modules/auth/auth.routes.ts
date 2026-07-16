import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { authenticate } from '../../middleware/authenticate.js'
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

export const authRouter = Router()

authRouter.post('/login', loginLimiter, authController.login)
authRouter.post('/logout', authenticate, authController.logout)
authRouter.get('/me', authenticate, authController.me)
