import type { SignOptions } from 'jsonwebtoken'

const MINIMUM_SECRET_LENGTH = 32

export const getJwtConfig = () => {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
    )
  }

  return {
    audience: 'ems-client',
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as SignOptions['expiresIn'],
    issuer: 'ems-api',
    secret,
  }
}
