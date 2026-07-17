const ACCESS_TOKEN_KEY = 'ems.accessToken'
export const AUTH_SESSION_EXPIRED_EVENT = 'ems:session-expired'

const canUseStorage = () => typeof window !== 'undefined'

export const tokenStorage = {
  get: () => (canUseStorage() ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null),
  set: (token: string) => {
    if (canUseStorage()) window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clear: () => {
    if (canUseStorage()) window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}

export const expireStoredSession = () => {
  tokenStorage.clear()
  if (canUseStorage()) window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}
