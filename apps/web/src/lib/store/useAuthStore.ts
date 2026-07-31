'use client';

import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import axios from "axios";
import { CAuthStore, CAuthUser, CUserLocation } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";
import { fetchUserLocation } from "../helpers/getUserLocation";






export const useAuthStore = create<CAuthStore>(
  persist(
    (set, get) => ({
      authUser: null,
      setAuthUser: (authUser: CAuthUser | null) => set({ authUser }),
      clearAuthUser: () => set({ authUser: null, hasInitialized: false }),
      setAuthLoading: (loading: boolean) => set({ isAuthLoading: loading }),
      setHasInitialized: (value: boolean) => set({ hasInitialized: value }),
      setUserLoggedInitialized: (value: boolean) => set({ userLoggedInitialized: value }),
      userLoggedInitialized: false,
      hasInitialized: false,
      isAuthLoading: true,
      userLocation: null,
      setUserLocation: (location: CUserLocation) => set({ userLocation: location }),
      fetchUser: async () => {
        const { setAuthLoading } = get();
        setAuthLoading(true);
        try {
          const response = await axios("/api/users/me");
          // clientLogger.debug("Response from fetchUser", response);
          if (response.data.user) {
            set({
              authUser: response.data.user, isAuthLoading: false,
              hasInitialized: true,
            });

          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          clientLogger.info(`Error in fetching user: ${message}`);
          // console.log(error);
        }
      },
      saveUserGeography: async () => {
        try { 
          if(get().userLocation === null){
            const location = await fetchUserLocation()
            set({ userLocation: location });
          }
        } catch (error: unknown) {

        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: CAuthStore | undefined) => {
        if (!state) return {};
        return {
          hasInitialized: state.hasInitialized,
          userLoggedInitialized: state.userLoggedInitialized
        }
      },
      onRehydrateStorage: () => (state: CAuthStore | undefined) => {

        if (state) {
          const typedState = state as CAuthStore;
          clientLogger.info("Rehydrated state:", { hasInitialized: typedState.hasInitialized, userLoggedInitialized: typedState.userLoggedInitialized });
        }
        // console.log("Rehydrated state:", state);
      },
    },

  ) as unknown as StateCreator<CAuthStore> & PersistOptions<CAuthStore, CAuthStore>
);