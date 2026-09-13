'use client';

import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner"
import { CCartStore } from "@/types/client";
import { clientLogger } from "@/utils/logger/clientLogger";


export const useCartStore = create<CCartStore>((set) => ({
    cart: {},


    fetchCart: async () => {
        try {
            const response = await axios.get("/api/cart")
            set({ cart: response.data });

            // logger.debug("Response", response.data);
            return response.data

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
            clientLogger.error(message);
            toast.error(message);

        }
    },

}));