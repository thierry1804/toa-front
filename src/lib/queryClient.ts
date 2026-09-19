import { QueryClient } from '@tanstack/react-query'

export const QUERY_NETWORK_MODE = 'offlineFirst' as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Court : les états métier (statuts, consultations, documents) changent côté serveur. Les données
      // de référence longues déclarent leur propre staleTime. Hors-ligne, offlineFirst garde le cache.
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: QUERY_NETWORK_MODE,
    },
    mutations: {
      retry: 0,
    },
  },
})

