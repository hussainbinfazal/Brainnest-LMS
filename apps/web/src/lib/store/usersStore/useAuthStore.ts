"use client";

import { create } from "zustand";
import axios from "axios";
import { CAuthStore, CAuthUser, CUserLocation } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";
import { fetchUserLocation } from "../../helpers/getUserLocation";

export const useAuthStore = create<CAuthStore>((set, get) => ({
  authUser: null,
  setAuthUser: (authUser: CAuthUser) => set({ authUser }),
  clearAuthUser: () => set({ authUser: null }),
  setAuthLoading: (loading: boolean) => set({ isAuthLoading: loading }),
  isAuthLoading: true,
  userLocation: null,
  setUserLocation: (location: CUserLocation) => set({ userLocation: location }),
  fetchAuthUser: async () => {
    const { setAuthLoading } = get();
    setAuthLoading(true);
    try {
      const response = await axios("/api/users/me");
      // clientLogger.debug("Response from fetchUser", response);
      if (response.data.user) {
        set({
          authUser: response.data.user,
          isAuthLoading: false,
        });
      }
    } catch (error: unknown) {
      let message = "Something went wrong";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message || message;

      } else if (error instanceof Error) {
        message = error.message;
      }
      clientLogger.info(`Error in fetching user`, { message, error });
      set({
        authUser: null,
        isAuthLoading: false,
      })
    } finally {
      setAuthLoading(false);
      set({
        isAuthLoading: false
      })

    }
  },
  saveUserGeography: async (): Promise<void> => {
    try {
      if (get().userLocation === null) {
        const location = await fetchUserLocation();
        set({ userLocation: location });
      }
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : "Something went wrong";
      clientLogger.error("Something went wrong, while fetching the user location", { message, error })

    }
  },
}));
