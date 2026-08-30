// Opaque `no-cors` ping: the response is opaque, so any network reply
// (captive portal, 502 HTML, etc.) looks like success. Switching to
// `credentials: 'include'` would need CORS on `/api/` and would break the
// current cross-origin VITE_API_URL case. Keep no-cors.
export async function pingApiReachable(): Promise<boolean> {
  const base = import.meta.env.VITE_API_URL ?? ''
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 5_000)
  try {
    await fetch(`${base}/api/`, {
      method: 'GET',
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}
