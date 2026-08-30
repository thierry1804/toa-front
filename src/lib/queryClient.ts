import { QueryClient } from '@tanstack/react-query'

export const QUERY_NETWORK_MODE = 'offlineFirst' as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: QUERY_NETWORK_MODE,
    },
    mutations: {
      retry: 0,
    },
  },
})

