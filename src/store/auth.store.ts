import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Profile, UserRole } from "@/types";

interface AuthState {
  user: Profile | null;
  gymId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: Profile | null) => void;
  setGymId: (gymId: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      gymId: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setGymId: (gymId) => set({ gymId }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          gymId: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      hasRole: (roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: "crossflow-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        gymId: state.gymId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
