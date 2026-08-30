import api from '@/lib/axios'
import { withNewestFirst } from '@/lib/listOrder'
import { withSnapshotFallback } from '@/offline/withSnapshotFallback'
import { snapshotById, snapshotList } from '@/offline/snapshotRead'
import type { ActivityPlanning, ActivityPlanningCreate, ActivityPlanningUpdate, HydraCollection, User } from '@/types'

export const activityPlanningApi = {
  list: (params?: { page?: number; itemsPerPage?: number }) =>
    withSnapshotFallback(
      () =>
        api.get<HydraCollection<ActivityPlanning>>('/api/activity_plannings', {
          params: withNewestFirst(params),
        }).then((r) => r.data),
      () => snapshotList<ActivityPlanning>('activityPlannings', params),
    ),

  getById: (id: number) =>
    withSnapshotFallback(
      () => api.get<ActivityPlanning>(`/api/activity_plannings/${id}`).then((r) => r.data),
      () => snapshotById<ActivityPlanning>('activityPlannings', id),
    ),

  create: (data: ActivityPlanningCreate) =>
    api.post<ActivityPlanning>('/api/activity_plannings', data).then((r) => r.data),

  update: (id: number, data: ActivityPlanningUpdate) =>
    api.put<ActivityPlanning>(`/api/activity_plannings/${id}`, data).then((r) => r.data),

  patch: (id: number, data: Partial<ActivityPlanningUpdate>) =>
    api.patch<ActivityPlanning>(`/api/activity_plannings/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/activity_plannings/${id}`),

  getPrestataires: () =>
    api.get<HydraCollection<User>>('/api/prestataires').then((r) => r.data),
}
