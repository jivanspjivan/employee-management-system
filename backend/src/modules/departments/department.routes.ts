import { Router } from 'express'

import { authenticate } from '../../middleware/authenticate.js'
import * as departmentController from './department.controller.js'

export const departmentRouter = Router()

departmentRouter.get('/', authenticate, departmentController.listDepartments)
