import { Router } from "express";
import {  } from "../../controllers/chat/chatController";
import { deleteMessage, generateNewMessage, getAllMessages, updateMessage } from "../../controllers/message/messageController";
const router: Router = Router();

router.post("/createMessage", generateNewMessage);
router.put("updateMessage", updateMessage);
router.delete("deleteMessage", deleteMessage);
// router.put("chat/:Id", updateChat);
router.get("all/:skip/:limit",getAllMessages)

export default router;