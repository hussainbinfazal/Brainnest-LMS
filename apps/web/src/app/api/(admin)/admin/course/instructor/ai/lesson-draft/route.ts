import { auth } from "@/auth";
import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { LEVELS } from "@/locales/locales";
import { ISessionUser } from "@/types/server";
import { getErrorMessage, USER_ROLE } from "@repo/shared";
import { ADMIN_AI_LESSON_DRAFT_IP_KEY, ADMIN_AI_LESSON_DRAFT_USER_KEY, checkIp, checkUser, GENERATE_DESCRIPTION_STATUS, getCachedHash, getCachedHashIO, logger } from "@repo/shared/server";
import axios from "axios";
import { Session } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";


const lessonDraftRequestSchema = z.array(z.object({
    publicId: z.string().trim().min(1).max(255),
    courseId: z.string().trim().optional(),
    lessonId: z.string().trim().optional(),
    courseTitle: z.string().trim().optional(),
    courseDescription: z.string().trim().optional(),
    lessonTitle: z.string().trim().optional(),
    sectionTitle: z.string().trim().optional(),
    sectionDescription: z.string().trim().optional(),
    category: z.string().trim().optional(),
    level: z.enum(LEVELS).optional(),
    language: z.string().trim().optional(),
})).min(1);

export async function POST(request: NextRequest) {
    try {
        const { allowed, retryAfterSec, ip } = await checkIp(
            request,
            ADMIN_AI_LESSON_DRAFT_IP_KEY.namespace,
            ADMIN_AI_LESSON_DRAFT_IP_KEY.max,
            ADMIN_AI_LESSON_DRAFT_IP_KEY.windowSec
        );
        if (!allowed)
            return failResponse(
                { message: "Too many requests" },
                429,
                undefined,
                { "Retry-After": String(retryAfterSec) },
                true
            );
        const authSession: Session | null = await auth();
        if (!authSession)
            return failResponse(
                { message: "Unauthorized", ip: ip },
                401,
                undefined,
                undefined,
                true
            );
        const sessionUser: ISessionUser | null = authSession?.user;
        if (sessionUser?.role !== USER_ROLE.INSTRUCTOR) {

            logger.warn("Unauthorized access attempt in admin course update route", { ip: ip });
            return failResponse(
                { message: "You are not authorized" },
                401,
                undefined,
                undefined,
                true
            );
        }
        const userId: string = sessionUser.id;
        const { allowed: userAllowed, retryAfterSec: userRetryAfterSec } =
            await checkUser(
                userId,
                ADMIN_AI_LESSON_DRAFT_USER_KEY.namespace,
                ADMIN_AI_LESSON_DRAFT_USER_KEY.max,
                ADMIN_AI_LESSON_DRAFT_USER_KEY.windowSec
            );
        if (!userAllowed)
            return failResponse(
                { message: "Too many requests" },
                429,
                undefined,
                { "Retry-After": String(userRetryAfterSec) },
                true
            );

        const body = await parseBody(request, lessonDraftRequestSchema);
        if (!body.ok) return body.response;

        const workerUrl = process.env.WORKER_URL;
        const internalSecret = process.env.INTERNAL_AUTH_SECRET;
        if (!workerUrl || !internalSecret) {
            throw new Error("WORKER_URL and INTERNAL_AUTH_SECRET must be configured");
        }

        await axios.post(
            // Worker address from a server-only env var
            `${workerUrl}/transcribe/audioToText`,
            {
                videos: body.data.map(({ publicId, courseId, lessonId, courseTitle, courseDescription, lessonTitle, sectionTitle, sectionDescription, category, level, language }) => ({
                    publicId,
                    userId,
                    courseId,
                    lessonId,
                    course: { courseTitle, courseDescription, lessonTitle, sectionTitle, sectionDescription, category, level, language },
                })),
            },
            // Internal secret header plus a timeout so the route cannot hang
            { headers: { "x-internal-secret": internalSecret }, timeout: 10_000 }
        );
        return successResponse({ message: "Transcription job queued" }, 202, undefined, undefined, true);
    } catch (error: unknown) {
        console.log("This is the error in admin ai lesson draft route ", error, error instanceof Error && error.message);
        const errorMessage = getErrorMessage(error, "Unknown error in admin ai lesson draft route");
        logger.error("Error in admin ai lesson draft route", { error: error instanceof Error ? error : undefined, message: errorMessage });
        return failResponse(
            { message: "Internal server error" },
            500,
            undefined,
            undefined,
            true
        );
    }
}


export async function GET(request: NextRequest) {
    try {
        const authSession: Session | null = await auth();
        if (!authSession) {
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
        }

        const sessionUser: ISessionUser | null = authSession.user;
        if (sessionUser?.role !== USER_ROLE.INSTRUCTOR) {
            return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true);
        }

        const publicId = z.string().trim().min(1).max(255).safeParse(
            request.nextUrl.searchParams.get("publicId")
        );
        const lessonId = z.string().trim().min(1).max(255).optional().safeParse(
            request.nextUrl.searchParams.get("lessonId") ?? undefined
        );
        if (!publicId.success) {
            return failResponse({ message: "A valid publicId is required" }, 400, undefined, undefined, true);
        }
        if (!lessonId.success) {
            return failResponse({ message: "A valid lessonId is required" }, 400, undefined, undefined, true);
        }

        const cachedDraft = await getCachedHash(
            GENERATE_DESCRIPTION_STATUS.namespace,
            `${publicId.data}:${sessionUser.id}:${lessonId.data}`
        );
        const status = cachedDraft?.status;
        const transcriptStatus =
            status === "processing" || status === "ready" || status === "failed"
                ? status
                : "idle";
        const draftSource = cachedDraft?.["draft.source"];
        const transcriptDraft = {
            description: cachedDraft?.["draft.description"],
            ...(draftSource === "transcript" || draftSource === "metadata"
                ? { source: draftSource }
                : {}),
        };
        logger.info("This the generated transcription on the server side of the lesson draft status route", {
            publicId: publicId.data,
            userId: sessionUser.id,
            lessonId: lessonId.data,
            status: transcriptStatus,
            draft: transcriptDraft,
        });
        // await connectDB(process.env.MONGODB_URI);
        // const transcript = await LessonTranscript.findOne({
        //     publicId: publicId.data,
        //     userId: sessionUser.id,
        // })
        //     .select({ status: 1, draft: 1, _id: 0 })
        //     .lean();

        return successResponse(
            { status: transcriptStatus, draft: transcriptDraft },
            200,
            undefined,
            undefined,
            true
        );
    } catch (error: unknown) {
        console.log("This is the error in lesson draft status route ", error, error instanceof Error && error.message);
        const errorMessage = getErrorMessage(error, "Unknown error in lesson draft status route");
        logger.error("Error in lesson draft status route", {
            error: error instanceof Error ? error : undefined,
            message: errorMessage,
        });
        return failResponse({ message: "Internal server error" }, 500, undefined, undefined, true);
    }
}
