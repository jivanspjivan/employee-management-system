import { createClient, type RedisClientType } from 'redis'

import { logger } from './logger.js'

const redisUrl = process.env.NODE_ENV === 'test' ? undefined : process.env.REDIS_URL
const redisRetryCooldownMs = Number(process.env.REDIS_RETRY_COOLDOWN_MS ?? 30_000)
let client: RedisClientType | null = null
let connectionPromise: Promise<RedisClientType | null> | null = null
let unavailableUntil = 0

const getClient = async () => {
  if (!redisUrl) return null
  if (Date.now() < unavailableUntil) return null
  if (client?.isReady) return client
  if (connectionPromise) return connectionPromise

  client ??= createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 750,
      reconnectStrategy: false,
    },
  })
  client.on('error', (error) => {
    logger.debug('Redis client error', { error })
  })

  connectionPromise = client
    .connect()
    .then(() => {
      unavailableUntil = 0
      return client
    })
    .catch((error: unknown) => {
      unavailableUntil = Date.now() + redisRetryCooldownMs
      logger.warn('Redis connection unavailable; continuing without cache', { error })
      client = null
      return null
    })
    .finally(() => {
      connectionPromise = null
    })

  return connectionPromise
}

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const redis = await getClient()
    const value = await redis?.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    logger.warn('Redis cache read failed', { error, key })
    return null
  }
}

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number) => {
  try {
    const redis = await getClient()
    await redis?.set(key, JSON.stringify(value), { EX: ttlSeconds })
  } catch (error) {
    logger.warn('Redis cache write failed', { error, key })
  }
}

export const cacheDelete = async (key: string) => {
  try {
    const redis = await getClient()
    await redis?.del(key)
  } catch (error) {
    logger.warn('Redis cache invalidation failed', { error, key })
  }
}
