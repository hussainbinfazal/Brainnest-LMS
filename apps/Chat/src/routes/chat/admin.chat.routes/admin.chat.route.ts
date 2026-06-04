 import { Router } from "express";
import { getChatOfAdmin } from "apps/Chat/src/controllers/chat/admin/admin.chat.controller";
const router = Router();

router.get("getChat/admin/:Id", getChatOfAdmin);


export default router;