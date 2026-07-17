import type { ApiErrorPayload } from './types'
import { expireStoredSession, tokenStorage } from '../auth/token-storage'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '')

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return undefined
  return response.json()
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { body, headers, token = tokenStorage.get(), ...requestInit } = options
  const requestHeaders = new Headers(headers)

  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...requestInit,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to the server')
  }

  const payload = await parseResponse(response)
  if (!response.ok) {
    const apiError = payload as Partial<ApiErrorPayload> | undefined
    if (response.status === 401 && token) expireStoredSession()
    throw new ApiError(
      response.status,
      apiError?.error?.code ?? 'REQUEST_FAILED',
      apiError?.error?.message ?? 'The request could not be completed',
      apiError?.error?.details,
    )
  }

  return payload as T
}
