import { Router } from "express";
import { getAllChat, createChat,getChat  } from "../../controllers/chat/chatController";
const router = Router();

router.get("/all/chats", getAllChat);
router.post("chat/:Id", createChat);

export default router;