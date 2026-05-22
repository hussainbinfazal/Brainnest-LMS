import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";
import { IncomingMessage } from "http";
import { ServerResponse } from "http";


export const loggerMiddleware = pinoHttp({
    logger,
    genReqId: (req:IncomingMessage,res:ServerResponse) => {
        const id = randomUUID();
        req.id = id;
        res.setHeader("x-request-Id", id);
        return id;
    },
    customSuccessMessage: (req:IncomingMessage) => {
        return `${req.method} ${req.url} - ${req.id}`;
    },
    customErrorMessage: (req:IncomingMessage,res:ServerResponse, error: Error) => { 
        return `${req.method} ${req.url} - ${req.id} - ${error.message} failed`;
    },

    serializers:{
        req(req:IncomingMessage){
            return {
                method: req.method,
                url: req.url,
                id: req.id
            }
        },
        res(res:ServerResponse){
            return {
                statusCode: res.statusCode
            }
        },
    }
})