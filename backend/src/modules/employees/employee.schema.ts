import { z } from 'zod'

import { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'

export const employeeIdParamSchema = z.object({
  id: z.uuid(),
})

const roleQuerySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(EmployeeRole))
  .optional()

const statusQuerySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(EmployeeStatus))
  .optional()

export const employeeListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(255).optional(),
    departmentId: z.uuid().optional(),
    role: roleQuerySchema,
    status: statusQuerySchema,
    sortBy: z.enum(['name', 'joiningDate']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict()

export const employeeSearchQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(255),
    limit: z.coerce.number().int().min(1).max(10).default(4),
  })
  .strict()

const employeeFields = {
  employeeId: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((email) => email.toLowerCase()),
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
  status: z.enum(EmployeeStatus),
  role: z.enum(EmployeeRole),
  reportingManagerId: z.uuid().optional().nullable(),
  profileImageUrl: z.url().max(500).optional().nullable(),
}

export const createEmployeeSchema = z
  .object({
    ...employeeFields,
    password: z.string().min(8).max(72),
    status: employeeFields.status.default(EmployeeStatus.ACTIVE),
    role: employeeFields.role.default(EmployeeRole.EMPLOYEE),
  })
  .strict()

export const updateEmployeeSchema = z
  .object(employeeFields)
  .omit({ reportingManagerId: true })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'At least one field is required')

export const updateOwnProfileSchema = z
  .object({
    name: employeeFields.name,
    phone: employeeFields.phone,
    profileImageUrl: employeeFields.profileImageUrl,
  })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'At least one field is required')

export const assignManagerSchema = z
  .object({
    reportingManagerId: z.uuid().nullable(),
  })
  .strict()

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>
export type EmployeeSearchQuery = z.infer<typeof employeeSearchQuerySchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
