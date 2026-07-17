import { EmployeeRole } from '../generated/prisma/enums.js'

export const editableEmployeeFields = [
  'employeeId',
  'name',
  'email',
  'phone',
  'departmentId',
  'designation',
  'salary',
  'joiningDate',
  'status',
  'role',
  'profileImageUrl',
] as const

export type EditableEmployeeField = (typeof editableEmployeeFields)[number]
type EditScope = 'selfEdit' | 'edit'
type FieldRules = Partial<Record<EditableEmployeeField, boolean>>

type EmployeeFieldPermissionConfig = Record<
  EmployeeRole,
  Record<EditScope, FieldRules>
>

/**
 * Field-level edit overrides. Missing values use the role default below.
 * API field names are used so this can be checked directly against request bodies.
 */
export const employeeFieldPermissions: EmployeeFieldPermissionConfig = {
  [EmployeeRole.EMPLOYEE]: {
    selfEdit: {
      departmentId: false,
      designation: false,
      email: false,
      employeeId: false,
      joiningDate: false,
      name: true,
      phone: true,
      profileImageUrl: true,
      role: false,
      salary: false,
      status: false,
    },
    edit: {
      email: false,
      employeeId: false,
      phone: false,
    },
  },
  [EmployeeRole.HR_MANAGER]: {
    selfEdit: {
      employeeId: false,
    },
    edit: {
      email: true,
      employeeId: false,
    },
  },
  [EmployeeRole.SUPER_ADMIN]: {
    selfEdit: {
      employeeId: false,
    },
    edit: {
      employeeId: false,
    },
  },
}

export const canEditEmployeeField = (
  role: EmployeeRole,
  scope: EditScope,
  field: EditableEmployeeField,
) => employeeFieldPermissions[role][scope][field] !== false

export const isEditableEmployeeField = (field: string): field is EditableEmployeeField =>
  (editableEmployeeFields as readonly string[]).includes(field)
