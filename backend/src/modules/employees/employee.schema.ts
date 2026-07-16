import { z } from 'zod'

export const employeeIdParamSchema = z.object({
  id: z.uuid(),
})
