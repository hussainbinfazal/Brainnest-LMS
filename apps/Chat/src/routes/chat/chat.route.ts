import { Router } from "express";
import { getAllChat, createChat,getChat, updateChat, deleteChat  } from "../../controllers/chat/chatController";
const router = Router();

router.get("getChat/:Id", getChat);
router.get("getAllChat", getAllChat);
router.post("createChat", createChat);
router.put("chat/:Id", updateChat);
router.delete("chat/:Id", deleteChat);

export default router;