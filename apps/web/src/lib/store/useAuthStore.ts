'use client';

import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import axios from "axios";
import { CAuthStore, CAuthUser, CUserLocation } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";
import { fetchUserLocation } from "../helpers/getUserLocation";






export const useAuthStore = create<CAuthStore>(

  (set, get) => ({
    authUser: null,
    setAuthUser: (authUser: CAuthUser) => set({ authUser }),
    clearAuthUser: () => set({ authUser: null }),
    setAuthLoading: (loading: boolean) => set({ isAuthLoading: loading }),
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
          });

        }
      } catch (error: unknown) {
        let message = "Something went wrong";
        if (axios.isAxiosError(error)) {
          message =
            error.response?.data?.message ||
            error.message ||
            message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        clientLogger.info(`Error in fetching user: ${message}`);
        // console.log(error);
      }
    },
    saveUserGeography: async () => {
      try {
        if (get().userLocation === null) {
          const location = await fetchUserLocation()
          set({ userLocation: location });
        }
      } catch (error: unknown) {

      }
    },
  }),

);