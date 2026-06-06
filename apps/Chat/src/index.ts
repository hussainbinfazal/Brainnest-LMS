import express, { Request, Response } from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { loggerMiddleware } from './middleware/logger.middleware';
import { authMiddleware } from './middleware/middleware';
import chatRoutes from './routes/chat/chat.route';
import { chatRateLimiter, globalRateLimiter, messageRateLimiter } from './middleware/rate.middleware';
import paymentRoutes from './routes/payment/payment.routes';


configDotenv({ path: "./.env" });

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(loggerMiddleware);
app.use(cookieParser());
app.use(globalRateLimiter)
app.use(
  "/api/chat",
  authMiddleware,
  chatRateLimiter,
  chatRoutes
);
app.use(
  "/api/message",
  authMiddleware,
  messageRateLimiter,
  chatRoutes
);
app.use(
  "/api/chat/payemnt",
  authMiddleware,
  messageRateLimiter,
  paymentRoutes
);
app.get('/', (req:Request, res:Response) => {
    res.send('Workers are running Successfully');
});
app.get('/health', (req:Request, res:Response) => {
    res.send('Workers are healthy & running');
});
app.listen(process.env.PORT, () => {
    console.log('Server is running on port', process.env.PORT);
});