import api from '@/lib/axios'
import type { ActivityPlanning, ActivityPlanningCreate, ActivityPlanningUpdate, HydraCollection, User } from '@/types'

export const activityPlanningApi = {
  list: (params?: { page?: number; itemsPerPage?: number }) =>
    api.get<HydraCollection<ActivityPlanning>>('/api/activity_plannings', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<ActivityPlanning>(`/api/activity_plannings/${id}`).then((r) => r.data),

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
