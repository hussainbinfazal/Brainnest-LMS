import {
  getChatOfAdmin,
  getChatStatsAdmin,
} from 'apps/Chat/src/controllers/chat/admin/admin.chat.controller';
import { Router } from 'express';

const router: Router = Router();

router.get('getChat/admin/:Id', getChatOfAdmin);
router.get('getChatStats/admin', getChatStatsAdmin);

export default router;
