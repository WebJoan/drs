import { create } from 'zustand'
import type { User } from '@/lib/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false, // Изначально не загружаем
  setUser: (user) =>
    set(() => ({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    })),
  setLoading: (loading) =>
    set((state) => ({
      ...state,
      isLoading: loading,
    })),
  reset: () =>
    set(() => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })),
}))

export const useAuth = () => useAuthStore((state) => state)
