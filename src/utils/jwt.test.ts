import { describe, expect, it } from 'vitest'
import { isTokenExpiring } from './jwt'

const token = (exp?: number) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${b64({ alg: 'none' })}.${b64(exp === undefined ? {} : { exp })}.sig`
}
const now = Date.UTC(2026, 9, 15, 12, 0, 0)

describe('isTokenExpiring', () => {
  it('is true when the token expires within the margin, or already expired', () => {
    expect(isTokenExpiring(token(now / 1000 + 10), 30_000, now)).toBe(true)
    expect(isTokenExpiring(token(now / 1000 - 5), 30_000, now)).toBe(true)
  })
  it('is false when there is time left', () => {
    expect(isTokenExpiring(token(now / 1000 + 600), 30_000, now)).toBe(false)
  })
  it('does not force a refresh for unreadable tokens or tokens without expiry', () => {
    expect(isTokenExpiring('not-a-jwt', 30_000, now)).toBe(false)
    expect(isTokenExpiring(token(), 30_000, now)).toBe(false)
  })
})
