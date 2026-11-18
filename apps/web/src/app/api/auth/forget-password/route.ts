import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CACHE_TTL, checkIp, connectDB, FORGET_PASSWORD_IP_KEY, getRedisClient, logger, passJobToWorker, PASSWORD_RESET_TOKEN, setCached, User } from "@repo/shared/server";
import z from "zod";
import { getErrorMessage } from "@repo/shared";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { workerApiLinks } from "@/utils/workerApiLinks";


const forgetPasswordBodySchema = z.object({
    email: z.string().email(),
});
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const { allowed, retryAfterSec, ip } = await checkIp(
            req,
            FORGET_PASSWORD_IP_KEY.namespace,
            FORGET_PASSWORD_IP_KEY.max,
            FORGET_PASSWORD_IP_KEY.windowSec
        )
        if (!allowed) {
            logger.error("Too many requests", { ip: ip });
            return failResponse(
                { message: "Too many requests" },
                429,
                undefined,
                { "Retry-After": String(retryAfterSec) },
                true
            );
        };

        const parsedBody = await parseBody(req, forgetPasswordBodySchema);
        if (!parsedBody.ok) {
            if (!parsedBody.ok) return parsedBody.response;
        }

        const { email } = parsedBody.data;
        await connectDB(process.env.MONGODB_URI!);
        const user = await User.findOne({ email }).lean().exec();
        if (user?.password) {
            const token = crypto.randomBytes(10).toString("hex");
            const hash = crypto.createHash("sha256").update(token).digest("hex");
            await setCached(PASSWORD_RESET_TOKEN.namespace, hash, user._id, CACHE_TTL.LONG);
            await passJobToWorker(workerApiLinks.auth.forgetPassword, { email, token });
        }
        return successResponse({ message: "If that email exists, a link was sent." }, 200, undefined, undefined, true);
        // TODO: send email with token
    } catch (error: unknown) {
        const message = getErrorMessage(error, "Failed to send reset password email");
        logger.error("Failed to send reset password email", { error, message });
        return failResponse({ message }, 500, undefined, undefined, true);
    }
}