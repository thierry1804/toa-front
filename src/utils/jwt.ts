export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export function currentUserId(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const id = payload.id ?? payload.sub
  if (id == null || id === '') return null
  return String(id)
}

/** Vrai si le jeton expire dans `skewMs` (défaut 30 s) ou est illisible/sans date d'expiration connue → on ne force rien. */
export function isTokenExpiring(token: string, skewMs = 30_000, now = Date.now()): boolean {
  const exp = decodeJwtPayload(token)?.exp
  if (typeof exp !== 'number') return false
  return exp * 1000 - now <= skewMs
}
