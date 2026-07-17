const ACCESS_TOKEN_KEY = 'ems.accessToken'

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
