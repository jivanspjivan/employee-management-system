import 'dotenv/config'

import { createApp } from './app.js'
import { logger } from './config/logger.js'

const port = Number(process.env.PORT ?? 4000)
const app = createApp()

app.listen(port, () => {
  logger.info('EMS API started', { port })
})
