import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getErrorMessage } from "@repo/shared";
import { checkIp, connectDB, getCached, logger RESET_PASSWORD_IP_KEY, User } from "@repo/shared/server";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";


const resetPasswordBodySchema = z.object({
    token: z.string(),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[0-9]/, "Password must include a number")
        .regex(/[^A-Za-z0-9\s]/, "Password must include a special character"),
});
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const { allowed, retryAfterSec, ip } = await checkIp(
            req,
            RESET_PASSWORD_IP_KEY.namespace,
            RESET_PASSWORD_IP_KEY.max,
            RESET_PASSWORD_IP_KEY.windowSec
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

        const parsedBody = await parseBody(req, resetPasswordBodySchema);
        if (!parsedBody.ok) {
            if (!parsedBody.ok) return parsedBody.response;
        }

        const { token, newPassword } = parsedBody.data;
        await connectDB(process.env.MONGODB_URI)
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        const userId = await getCached(PASSWORD_RESET_TOKEN.namespace, hash);
        if (!userId) {
            return failResponse({ message: "Invalid or expired link" }, 400, undefined, undefined, true);
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.findOneAndUpdate({ _id: userId }, { $set: { password: hashedPassword } });
        return successResponse({ message: "Password changed successfully" }, 200);
        // TODO: send email with token
    } catch (error: unknown) {
        const message = getErrorMessage(error, "Failed to send reset password email");
        logger.error("Failed to send reset password email", { error, message });
        return failResponse({ message }, 500, undefined, undefined, true);
    }
}
