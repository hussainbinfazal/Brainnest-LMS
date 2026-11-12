import { Router } from 'express';

import {
  createChat,
  deleteChat,
  getAllChat,
  getChat,
} from '../../controllers/chat/chatController';

const router: Router = Router();

router.get('getChat/:Id', getChat);
router.get('getAllChat', getAllChat);
router.post('createChat', createChat);
// router.put("chat/:Id", updateChat);
router.delete('chat/:Id', deleteChat);

export default router;
