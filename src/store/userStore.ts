import { create } from 'zustand'
import type { User } from '@/types'

interface UserState {
  users: User[]
  selectedUserId: string | null
  setUsers: (users: User[]) => void
  setSelectedUserId: (id: string | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  selectedUserId: null,
  setUsers: (users) => set({ users }),
  setSelectedUserId: (id) => set({ selectedUserId: id }),
}))
