import i18n from '@/lib/i18n'
import { useUiStore } from '@/store/ui.store'
import { syncQueue } from './syncQueue'
import { ingestFormData } from './blobStore'

export type EnqueueResult = 'queued' | 'skipped' | 'quota'

type QueueableConfig = {
  method?: string
  url?: string
  data?: unknown
  headers?: Record<string, unknown>
  _skipOfflineQueue?: boolean
  _skipAuthInterceptor?: boolean
}

const QUEUEABLE = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function enqueueOfflineMutation(
  originalRequest?: QueueableConfig | null,
): Promise<EnqueueResult> {
  if (!originalRequest) return 'skipped'
  if (originalRequest._skipOfflineQueue || originalRequest._skipAuthInterceptor) {
    return 'skipped'
  }

  const method = (originalRequest.method ?? '').toUpperCase()
  if (!QUEUEABLE.includes(method)) return 'skipped'

  if (typeof FormData !== 'undefined' && originalRequest.data instanceof FormData) {
    const ingested = await ingestFormData(originalRequest.data)
    if (!ingested.ok) {
      useUiStore.getState().addToast({
        message: i18n.t(
          'offline.quotaExceeded',
          'Fichier trop volumineux ou quota hors-ligne dépassé (15 Mo / fichier, 80 Mo au total)',
        ),
        type: 'error',
      })
      return 'quota'
    }

    await syncQueue.add({
      url: originalRequest.url ?? '',
      method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      formParts: ingested.formParts,
      contentType: 'multipart/form-data',
    })

    return 'queued'
  }

  let body: unknown
  try {
    body =
      typeof originalRequest.data === 'string'
        ? JSON.parse(originalRequest.data)
        : originalRequest.data
  } catch {
    body = originalRequest.data
  }

  const contentType =
    (originalRequest.headers?.['Content-Type'] as string | undefined) ??
    (originalRequest.headers?.['content-type'] as string | undefined)

  await syncQueue.add({
    url: originalRequest.url ?? '',
    method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body,
    contentType,
  })

  return 'queued'
}
