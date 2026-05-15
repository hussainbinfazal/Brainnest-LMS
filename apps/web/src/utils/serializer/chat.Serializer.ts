import { CChat } from "@/types/client";
import { serializeDocument } from "./serializeDocument";
import { IChat } from "@/types/model";

export function serializeChat(chat: IChat): CChat {
    return serializeDocument(chat) as unknown as CChat;
}
export function serializeChats(chats: IChat[]): CChat[] {
    return serializeDocument(chats) as unknown as CChat[];
}