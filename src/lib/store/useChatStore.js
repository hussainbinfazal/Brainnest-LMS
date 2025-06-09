'use client';

import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner"
export const useChatStore = create((set) => ({
    chat: [],
    setChat : (chat) => set({ chat }),

    

}));