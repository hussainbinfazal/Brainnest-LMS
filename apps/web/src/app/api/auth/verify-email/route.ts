import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { workerApiLinks } from "@/utils/workerApiLinks";
import { checkIp, checkUser, logger, passJobToWorker, VERIFY_EMAIL_IP_KEY, VERIFY_EMAIL_USER_KEY } from "@repo/shared/server";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const verifyEmailBodySchema = z.object({
    email: z.string().email()
})
export async function POST(request: NextRequest): Promise<NextResponse> {
    const { allowed: ipAllowed, retryAfterSec, ip } = await checkIp(
        request,
        VERIFY_EMAIL_IP_KEY.namespace,
        VERIFY_EMAIL_IP_KEY.max,
        VERIFY_EMAIL_IP_KEY.windowSec
    )
    if (!ipAllowed) {
        logger.warn('Too many attempts', {
            ip: ip
        })
        return failResponse({
            message: "Too many attempts"
        }, 429, undefined, undefined, true)
    };

    const parsedBody = await parseBody(request, verifyEmailBodySchema);
    if (!parsedBody.ok) {
        return parsedBody.response
    }
    const { email } = parsedBody.data;
    try {
        await passJobToWorker(
            workerApiLinks.email.verify,
            {
                email
            }
        );
    } catch (workerCallError: unknown) {
        const isAxiosError = axios.isAxiosError(workerCallError);
        const status =
            isAxiosError && workerCallError.code === "ECONNABORTED"
                ? 504
                : 502;

        logger.error("Something went wrong while passing job to the worker", {
            errorCode: isAxiosError ? workerCallError.code : undefined,
            workerStatus: isAxiosError
                ? workerCallError.response?.status
                : undefined,
            error: workerCallError,
        });

        return failResponse(
            {
                success: false,
                message: "Email service is temporarily unavailable",
            },
            status,
            undefined,
            undefined,
            true
        );
    }
    return successResponse({ message: "Verification Code has been sent on this email" },
        202,
        undefined,
        undefined,
        true
    )

}