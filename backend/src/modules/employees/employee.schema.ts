import { z } from 'zod'

import { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'

export const employeeIdParamSchema = z.object({
  id: z.uuid(),
})

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
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
