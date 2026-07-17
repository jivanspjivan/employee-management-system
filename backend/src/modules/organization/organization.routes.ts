import { Router } from 'express'

import { authenticate } from '../../middleware/authenticate.js'
import * as organizationController from './organization.controller.js'

export const organizationRouter = Router()

organizationRouter.get('/tree', authenticate, organizationController.getOrganizationTree)
