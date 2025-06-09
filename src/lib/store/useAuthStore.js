'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export const useAuthStore = create(persist(
  (set, get) => ({
    authUser: null,
    setAuthUser: (authUser) => set({ authUser }),
    clearAuthUser: () => set({ authUser: null, hasInitialized: false }),
    setAuthLoading: (loading) => set({ isAuthLoading: loading }),
    setHasInitialized: (value) => set({ hasInitialized: value }),
    setUserLoggedInitialized: (value) => set({ userLoggedInitialized: value }),
    userLoggedInitialized: false,
    hasInitialized: false,
    isAuthLoading: true,
    fetchUser: async () => {
      const { setAuthLoading } = get();
      setAuthLoading(true);
      try {
        const response = await axios("/api/users/me");
        // console.log("Response from fetchUser", response);
        if (response.data.user) {
          set({
            authUser: response.data.user, isAuthLoading: false,
            hasInitialized: true,
          });

        }
      } catch (error) {
        // console.log(error);
      }
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      hasInitialized: state.hasInitialized,
      userLoggedInitialized: state.userLoggedInitialized
    }),
    onRehydrateStorage: () => (state) => {
      // console.log("Rehydrated state:", state);
    },
  }
));