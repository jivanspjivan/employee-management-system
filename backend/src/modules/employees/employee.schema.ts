import { z } from 'zod'

import { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'

export const employeeIdParamSchema = z.object({
  id: z.uuid(),
})

export const createEmployeeSchema = z.object({
  employeeId: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Phone number is invalid')
    .optional()
    .nullable(),
  departmentId: z.uuid(),
  designation: z.string().trim().min(2).max(120),
  salary: z.coerce.number().nonnegative(),
  joiningDate: z.coerce.date(),
  status: z.enum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  role: z.enum(EmployeeRole).default(EmployeeRole.EMPLOYEE),
  reportingManagerId: z.uuid().optional().nullable(),
  profileImageUrl: z.url().max(500).optional().nullable(),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
