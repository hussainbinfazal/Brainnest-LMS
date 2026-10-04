"use client";

import { create } from "zustand";
import axios from "axios";
import { CAuthStore, CAuthUser, CUserLocation } from "@/types/client";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { fetchUserLocation } from "../../helpers/getUserLocation";
import { getErrorMessage } from "@repo/shared";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export const useAuthStore = create<CAuthStore>((set, get) => ({
  authUser: null,
  setAuthUser: (authUser: CAuthUser) => set({ authUser }),
  clearAuthUser: () => set({ authUser: null }),
  setAuthLoading: (loading: boolean) => set({ isAuthLoading: loading }),
  isAuthLoading: true,
  isUpdatingRole: false,
  userLocation: null,
  setUserLocation: (location: CUserLocation) => set({ userLocation: location }),
  updateUserToInstructor: async (userId: string): Promise<void> => {
    set({ isUpdatingRole: true })
    if (!userId) return
    try {
      const response = await axios.put(`/api/users/update/updateToInstructor/${userId}`);
      if (response.status === 200) {
        clientLogger.info("User's Role updated successfully", { userId });
        get().fetchAuthUser(); //Fetch the updated user
        clientLogger.info("Response from updating user to instructor", response);
        toast.success("Congratulations, You are now an Instructor");
        setTimeout(() => toast.success("Thank for being a part of our community"), 500);
        setTimeout(() => {
          signOut({ callbackUrl: '/login' })
        }, 1500)
      }
      // Sign out to force fresh session with new role

    } catch (error: unknown) {
      const message = getErrorMessage(error, "Something went wrong, while updating the role of the user to instructor");
      clientLogger.error("Something went wrong, while updating the role of the user to instructor", { error: message, userId });
      toast.error(message);
    } finally {
      set({ isUpdatingRole: false })
    }
  },
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
