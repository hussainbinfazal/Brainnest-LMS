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
            const message= error instanceof Error ? error.message : 'Something went wrong';
            clientLogger.error(message);
            
            toast.error(message);

        }
    },

}));