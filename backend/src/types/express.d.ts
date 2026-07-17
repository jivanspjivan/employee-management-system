import type { AuthenticatedPrincipal } from '../modules/auth/auth.types.js'

declare global {
  namespace Express {
    interface Request {
      authTokenVersion?: number
      employee?: AuthenticatedPrincipal
      requestId?: string
    }
  }
}

export {}
