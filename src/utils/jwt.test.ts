import { describe, it, expect, beforeEach } from 'vitest'
import { currentUserId, decodeJwtPayload } from './jwt'

function fakeJwt(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload)
  const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `aaa.${b64}.bbb`
}

beforeEach(() => {
  localStorage.clear()
})

describe('currentUserId', () => {
  it('returns null when no token', () => {
    expect(currentUserId()).toBeNull()
  })

  it('returns id from access_token payload', () => {
    localStorage.setItem('access_token', fakeJwt({ id: 'u-1' }))
    expect(currentUserId()).toBe('u-1')
  })
})

describe('decodeJwtPayload', () => {
  it('returns payload object', () => {
    const token = fakeJwt({ id: 'u-1', roles: ['ROLE_HSE'] })
    expect(decodeJwtPayload(token)).toMatchObject({ id: 'u-1' })
  })
})
