import type { RequestHandler } from 'express'

import * as dashboardService from './dashboard.service.js'

export const getDashboardStats: RequestHandler = async (_request, response) => {
  const stats = await dashboardService.getDashboardStats()

  response.status(200).json({ data: { stats } })
}

export const getDashboardCharts: RequestHandler = async (_request, response) => {
  const charts = await dashboardService.getDashboardCharts()

  response.status(200).json({ data: { charts } })
}
