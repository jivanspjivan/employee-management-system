import { Router } from 'express'

import { EmployeeRole } from '../../generated/prisma/enums.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as employeeController from './employee.controller.js'

export const employeeRouter = Router()

employeeRouter.get(
  '/',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  employeeController.listEmployees,
)

employeeRouter.get('/:id', authenticate, employeeController.getEmployeeById)
