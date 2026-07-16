import type { RequestHandler } from 'express'

import * as employeeService from './employee.service.js'

export const listEmployees: RequestHandler = async (_request, response) => {
  const employees = await employeeService.listEmployees()

  response.status(200).json({ data: { employees } })
}
