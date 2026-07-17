import type { RequestHandler } from 'express'

import * as departmentService from './department.service.js'

export const listDepartments: RequestHandler = async (_request, response) => {
  const departments = await departmentService.listDepartments()

  response.status(200).json({ data: { departments } })
}
