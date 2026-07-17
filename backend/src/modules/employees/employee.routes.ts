import { Router } from 'express'

import { EmployeeRole } from '../../generated/prisma/enums.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as employeeController from './employee.controller.js'

export const employeeRouter = Router()

employeeRouter.post(
  '/',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  employeeController.createEmployee,
)

employeeRouter.get(
  '/',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  employeeController.listEmployees,
)

employeeRouter.get(
  '/search',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  employeeController.searchEmployees,
)

employeeRouter.get('/:id', authenticate, employeeController.getEmployeeById)
employeeRouter.get('/:id/reportees', authenticate, employeeController.getDirectReportees)
employeeRouter.put('/:id', authenticate, employeeController.updateEmployee)
employeeRouter.patch(
  '/:id/manager',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  employeeController.assignManager,
)
employeeRouter.delete(
  '/:id',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN),
  employeeController.deleteEmployee,
)
