import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { CustomNextRequest } from "@/types/server";
import { logger } from '@repo/shared/server';
import { Ilogger } from "@repo/shared/logger/logger";
import { NextResponse } from "next/server";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const VALID_LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];
const logBodySchema = z.object({
    level: z.enum(VALID_LOG_LEVELS),
    message: z.string().min(1),
    meta: z.unknown().optional(),
    timestamp: z.unknown().optional(),
    userAgent: z.string().optional(),
    url: z.string().optional(),
});
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    try {
        const body = await parseBody(request, logBodySchema);
        if (!body.ok) return body.response;
        const { level, message, meta, timestamp, userAgent, url } = body.data;

        const logFn = logger[level as keyof Pick<Ilogger, LogLevel>];
        logFn(message, { meta, timestamp, userAgent, url });
        return successResponse({ success: true }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Failed to send log to server:", { message });
        return failResponse({ success: false, message: `Failed to send log to server` }, 500, undefined, undefined, true);
    }
}