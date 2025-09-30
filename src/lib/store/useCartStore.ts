'use client';

import { create} from "zustand";
import axios from "axios";
import { toast } from "sonner"
import { CartStore } from "@/types/client";


export const useCartStore = create<CartStore>((set) => ({
    cart: {},


    fetchCart: async () => {
        try {
            const response = await axios.get("/api/cart")
            set({ cart: response.data});

            // console.log("Response", response.data);
            return response.data

        } catch (error: any) {
            console.log(error);
            const errorMessage = error?.response?.data?.message || error || "Something went wrong";
            toast.error(errorMessage);


        }
    },

}));