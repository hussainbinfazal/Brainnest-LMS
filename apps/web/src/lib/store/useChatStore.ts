'use client';

import { CChatMessage, CChatStore } from "@/types/client";
import { create } from "zustand";



export const useChatStore = create<CChatStore>((set) => ({
    chat: [],
    setChat : (chat: CChatMessage[]) => set({ chat }),
}));