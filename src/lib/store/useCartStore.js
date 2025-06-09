'use client';

import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner"
export const useCartStore = create((set) => ({
    cart: {},


    fetchCart: async () => {
        try {
            const response = await axios.get("/api/cart")
            set({ cart: response.data});

            // console.log("Response", response.data);
            return response.data

        } catch (error) {
            console.log(error);
            const errorMessage = error?.response?.data?.message || error || "Something went wrong";
            toast.error(errorMessage);


        }
    },

}));