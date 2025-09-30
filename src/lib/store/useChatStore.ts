'use client';

import { ChatMessage, ChatStore } from "@/types/client";
import { create } from "zustand";



export const useChatStore = create<ChatStore>((set) => ({
    chat: [],
    setChat : (chat: ChatMessage[]) => set({ chat }),
}));