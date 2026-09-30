import { z } from "zod";
import { NextResponse } from "next/server";
import { failResponse } from "@/lib/helpers/failResponseHelper";
import { logger } from "@repo/shared/server";

type ParseResult<T> =
    | { ok: true; data: T }
    | { ok: false; response: NextResponse };

export async function parseBody<S extends z.ZodTypeAny>(
    request: Request,
    schema: S,
): Promise<ParseResult<z.infer<S>>> {
    let raw: unknown;
    try {
        raw = await request.json();
        logger.info("Parsed request body.");
    } catch {
        logger.error("Failed to parse request body.");
        return { ok: false, response: failResponse("Invalid request body.", 400, "INVALID_BODY") };
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return { ok: false, response: failResponse("Invalid request data.", 400, "VALIDATION_FAILED") };
    }
    return { ok: true, data: parsed.data };
}