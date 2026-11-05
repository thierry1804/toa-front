import { useMutation, useQuery } from '@tanstack/react-query'
import { meApi } from '@/api/meApi'

export const ME_KEY = ['me', 'profile'] as const

export function useMyProfile() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: meApi.get,
  })
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      meApi.changePassword(currentPassword, newPassword),
  })
}
