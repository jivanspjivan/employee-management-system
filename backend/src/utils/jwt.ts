import jwt from 'jsonwebtoken'
import { z } from 'zod'

import { getJwtConfig } from '../config/auth.js'
import type { EmployeeRole } from '../generated/prisma/enums.js'

const jwtPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']),
  tokenVersion: z.number().int().nonnegative(),
})

export type AccessTokenPayload = {
  employeeId: string
  role: EmployeeRole
  tokenVersion: number
}

export const signAccessToken = (payload: AccessTokenPayload) => {
  const config = getJwtConfig()

  return jwt.sign(
    {
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    },
    config.secret,
    {
      audience: config.audience,
      expiresIn: config.expiresIn,
      issuer: config.issuer,
      subject: payload.employeeId,
    },
  )
}

export const verifyAccessToken = (token: string) => {
  const config = getJwtConfig()
  const payload = jwt.verify(token, config.secret, {
    audience: config.audience,
    issuer: config.issuer,
  })

  return jwtPayloadSchema.parse(payload)
}
