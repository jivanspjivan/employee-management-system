import type { RequestHandler } from 'express'
import { z } from 'zod'

import * as departmentService from './department.service.js'

export const listDepartments: RequestHandler = async (_request, response) => {
  const departments = await departmentService.listDepartments()

  response.status(200).json({ data: { departments } })
}

const createDepartmentSchema = z.object({ name: z.string().trim().min(2).max(100) }).strict()

export const createDepartment: RequestHandler = async (request, response) => {
  const { name } = createDepartmentSchema.parse(request.body)
  const department = await departmentService.createDepartment(name)

  response.status(201).json({ message: 'Department created successfully', data: { department } })
}
