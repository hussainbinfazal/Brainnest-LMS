import { CustomNextRequest } from "@/types/server";
import { logger } from "@repo/shared";
import { Ilogger } from "@repo/shared/logger/logger";
import { NextResponse } from "next/server";

const VALID_LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const { level, message, meta, timestamp, userAgent, url } = await request.json()
        if (typeof message !== "string" || !message) {
            logger.error("Invalid log message");
        }

        const logFn = logger[level as keyof Pick<Ilogger, LogLevel>];
        logFn(message, { meta, timestamp, userAgent, url });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Failed to send log to server:", { message });
        return NextResponse.json({ success: false, message: `Failed to send log to server` }, { status: 500 });
    }
}