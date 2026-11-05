

import axios from "axios";
import { clientLogger } from "../clientLogger/clientLogger";
import { getErrorMessage } from "@repo/shared";

// Payload the browser sends to request an AI lesson draft.
export type LessonDraftInput = {
    // Pending Cloudinary public_id of the lecture video
    publicId: string;
    courseId?: string;
    lessonId?: string;
    // Course context for the prompt, all optional
    courseTitle?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    courseDescription?: string;
    lessonTitle?: string;
    category?: string;
    level?: string;
    language?: string;
};

export async function requestLessonDraft(input: LessonDraftInput[]) {
    try {
        const response = await axios.post("/api/admin/course/instructor/ai/lesson-draft", input);
        clientLogger.info("Transcription job queued", { status: response.status, message: response.data.message });
    } catch (error: unknown) {
        // console.error("This is the error in requestLessonDraft function ", error, error instanceof Error && error.message)
        const message = getErrorMessage(error, "Unknown error in requestLessonDraft");
        console.error("This is the error in requestLessonDraft job", { error, message });
        clientLogger.error("Failed to queue transcription job", { error, message });
        throw error;
    }
}
export type LessonDraftStatusInput = Pick<LessonDraftInput, "publicId" | "lessonId">;

export async function getLessonDraftStatus(input: LessonDraftStatusInput): Promise<void> {
    try {
        const response = await axios.get("/api/admin/course/instructor/ai/lesson-draft", {
            params: input,
        });
        clientLogger.info("[getLessonDraftStatus]", { status: response.status, message: response.data.message });
    } catch (error: unknown) {
        // console.error("This is the error in requestLessonDraft function ", error, error instanceof Error && error.message)
        const message = getErrorMessage(error, "Unknown error in requestLessonDraft status ");
        console.error("This is the error in requestLessonDraft status", { error, message });
        clientLogger.error("Failed to fetch lesson draft status", { error, message });
        throw error;
    }
}