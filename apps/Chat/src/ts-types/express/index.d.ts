import "express"
import pino from "pino";

declare global {
    namespace Express {
        interface Request {
            log: pino.Logger;
            id: string
        }
    }
}