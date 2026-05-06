'use client';

import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import axios from "axios";
import { AuthStore, AuthUser } from "@/types/client";
import { logger } from "@/utils/logger/logger.node";





export const useAuthStore = create<AuthStore>(
  persist(
    (set, get) => ({
      authUser: null,
      setAuthUser: (authUser: AuthUser | null) => set({ authUser }),
      clearAuthUser: () => set({ authUser: null, hasInitialized: false }),
      setAuthLoading: (loading: boolean) => set({ isAuthLoading: loading }),
      setHasInitialized: (value: boolean) => set({ hasInitialized: value }),
      setUserLoggedInitialized: (value: boolean) => set({ userLoggedInitialized: value }),
      userLoggedInitialized: false,
      hasInitialized: false,
      isAuthLoading: true,
      fetchUser: async () => {
        const { setAuthLoading } = get();
        setAuthLoading(true);
        try {
          const response = await axios("/api/users/me");
          // logger.debug("Response from fetchUser", response);
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
      partialize: (state: AuthStore | undefined) => {
        if (!state) return {};
        return {
          hasInitialized: state.hasInitialized,
          userLoggedInitialized: state.userLoggedInitialized
        }
      },
      onRehydrateStorage: () => (state: AuthStore | undefined) => {

        if (state) {
          const typedState = state as AuthStore;
          logger.info("Rehydrated state:", { hasInitialized: typedState.hasInitialized, userLoggedInitialized: typedState.userLoggedInitialized });
        }
        // console.log("Rehydrated state:", state);
      },
    }
  ) as unknown as StateCreator<AuthStore> & PersistOptions<AuthStore, AuthStore>
);