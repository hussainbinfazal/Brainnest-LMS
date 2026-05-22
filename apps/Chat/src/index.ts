import express, { Request, Response } from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import cookieParser from 'cookie-parser';
import { loggerMiddleware } from './middleware/logger.middleware';


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

app.get('/', (req:Request, res:Response) => {
    res.send('Workers are running Successfully');
});
app.get('/health', (req:Request, res:Response) => {
    res.send('Workers are healthy & running');
});
app.listen(process.env.PORT, () => {
    console.log('Server is running on port', process.env.PORT);
});