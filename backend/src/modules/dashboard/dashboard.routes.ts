import { Router } from 'express'

import { EmployeeRole } from '../../generated/prisma/enums.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as dashboardController from './dashboard.controller.js'

export const dashboardRouter = Router()

dashboardRouter.get(
  '/stats',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  dashboardController.getDashboardStats,
)

dashboardRouter.get(
  '/charts',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  dashboardController.getDashboardCharts,
)
