import { Router } from 'express'

import { EmployeeRole } from '../../generated/prisma/enums.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as departmentController from './department.controller.js'

export const departmentRouter = Router()

departmentRouter.get('/', authenticate, departmentController.listDepartments)
departmentRouter.post(
  '/',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  departmentController.createDepartment,
)
