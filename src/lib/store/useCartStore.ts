'use client';

import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner"
import { CartStore } from "@/types/client";
import { logger } from "@/utils/logger/logger";


export const useCartStore = create<CartStore>((set) => ({
    cart: {},


    fetchCart: async () => {
        try {
            const response = await axios.get("/api/cart")
            set({ cart: response.data });

            // logger.debug("Response", response.data);
            return response.data

        } catch (error: any) {
            logger.error(error);
            const errorMessage = error?.response?.data?.message || error || "Something went wrong";
            toast.error(errorMessage);

        }
    },

}));