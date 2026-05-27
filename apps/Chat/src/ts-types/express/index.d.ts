import "express"
import pino from "pino";

declare global {
    namespace Express {
        interface Request {
            log: pino.Logger;
            id: string;
            user?: {
                id: string;
                email?: string;
                name?: string;
                role?: string;
                phoneNumber?: string;
                profileImage?: string;
            };
        }
    }
}