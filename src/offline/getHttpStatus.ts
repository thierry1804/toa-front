export function getHttpStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  if (!('response' in err)) return undefined
  const response = (err as { response?: { status?: unknown } }).response
  return typeof response?.status === 'number' ? response.status : undefined
}

export function snapshotErrorCode(
  err: unknown,
): 'forbidden' | 'rateLimited' | 'tooLarge' | 'network' | 'unknown' {
  const status = getHttpStatus(err)
  if (status === 403) return 'forbidden'
  if (status === 429) return 'rateLimited'
  if (status === 413) return 'tooLarge'
  if (status === undefined) return 'network'
  return 'unknown'
}
