import type { AuthenticatedEmployee } from '../modules/auth/auth.types.js'

declare global {
  namespace Express {
    interface Request {
      authTokenVersion?: number
      employee?: AuthenticatedEmployee
    }
  }
}

export {}
