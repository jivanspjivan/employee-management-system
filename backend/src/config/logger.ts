import winston from 'winston'

const { combine, colorize, errors, json, printf, timestamp } = winston.format

const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: loggedAt, ...metadata }) => {
    const context = Object.keys(metadata).length
      ? ` ${JSON.stringify(metadata)}`
      : ''

    return `${loggedAt} ${level}: ${message}${context}`
  }),
)

const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format:
    process.env.NODE_ENV === 'production'
      ? productionFormat
      : developmentFormat,
  silent: process.env.NODE_ENV === 'test',
  transports: [new winston.transports.Console()],
})
