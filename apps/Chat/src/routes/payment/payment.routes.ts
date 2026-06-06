import { Router } from "express";
import { createChatPaymentOrder } from "../../controllers/payment/process/paymentController";
import { verifyChatPayment } from "../../controllers/payment/verify/verifyPaymentController";
const router: Router = Router();

router.post("/chat-payment/create", createChatPaymentOrder);
router.put("/chat-payment/verify", verifyChatPayment);


export default router;