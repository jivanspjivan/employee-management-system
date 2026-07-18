import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128),
})

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
})

export const passwordResetRequestParamSchema = z.object({
  id: z.uuid(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
