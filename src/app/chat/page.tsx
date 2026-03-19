import { JSX } from "react/jsx-runtime";
import ChatIdPageComp from "../components/ChatComp/ChatPageComp";
import { IChat } from "@/types/model";
import { connectDB } from "@/config/mongoDB/db";
import Chat from "@/models/Chat/chatModel";
import { CChat } from "@/types/client";
import { serializeChats } from "@/utils/serializer/chat.Serializer";
import { auth } from "@/auth";
import { logger } from "@/utils/logger/logger";

export default async function ChatPage(): Promise<JSX.Element> {


  let fetchChats: CChat[] = []
  const fetchChatOnServer = async (): Promise<CChat[]> => {
    try {
      await connectDB();
      const session = await auth();
      const userId: string = session?.user.id ?? '';
      const chatsSSR: IChat[] | null = await Chat.find({ sender: userId }).populate('sender', '_id name profileImage').populate('receiver', '_id name profileImage').populate('allMessages').lean();

      logger.debug({ fetchChats }, "fetchChats (before serializing)");
      if (chatsSSR.length > 0) {
        fetchChats = await serializeChats(chatsSSR) as CChat[];
      }
      return fetchChats;
      // Integrate serializer here for _Id fields to convert to string if needed
    } catch (error: any) {
      logger.error(error, "Error in fetching chat on server");
      fetchChats = [];
      throw error;
    }
  }

  fetchChatOnServer();
  return <ChatIdPageComp serverChats={fetchChats} />;
}
