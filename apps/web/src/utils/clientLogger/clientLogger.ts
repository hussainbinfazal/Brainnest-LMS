import axios from "axios";


export const clientLogger = {
    info: (message: string, meta?: unknown) => {
        console.info(message, meta);
    },
    warn: (message: string, meta?: unknown) => {
        console.warn(message, meta);
    },

    error: (message: string, meta?: unknown) => {
        console.error(message, meta);
        axios.post("/api/log", {
            level: "error",
            message,
            meta,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        }).catch((e: unknown) => {
            const errMessage = e instanceof Error ? e.message : 'Something went wrong';
            console.error("Failed to send log to server:", errMessage, e);
        });
    }
};