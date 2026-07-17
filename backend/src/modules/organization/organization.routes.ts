import { Router } from 'express'

import { EmployeeRole } from '../../generated/prisma/enums.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as organizationController from './organization.controller.js'

export const organizationRouter = Router()

organizationRouter.get(
  '/tree',
  authenticate,
  authorize(EmployeeRole.SUPER_ADMIN, EmployeeRole.HR_MANAGER),
  organizationController.getOrganizationTree,
)
