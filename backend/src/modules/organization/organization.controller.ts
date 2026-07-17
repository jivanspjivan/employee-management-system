import type { RequestHandler } from 'express'

import * as organizationService from './organization.service.js'

export const getOrganizationTree: RequestHandler = async (_request, response) => {
  const tree = await organizationService.getOrganizationTree()

  response.status(200).json({ data: { tree } })
}
