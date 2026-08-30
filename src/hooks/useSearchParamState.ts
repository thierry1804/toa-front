import { useSearchParams } from 'react-router-dom'

export function useSearchParamState(key: string, fallback = 'all') {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(key) ?? fallback

  const setValue = (next: string) => {
    const params = new URLSearchParams(searchParams)
    if (!next || next === fallback) params.delete(key)
    else params.set(key, next)
    setSearchParams(params, { replace: true })
  }

  return [value, setValue] as const
}
