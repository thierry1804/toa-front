import api from '@/lib/axios'
import type { LoginRequest, LoginResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/api/login_check', data, { _skipAuthInterceptor: true }).then((r) => r.data),
}
