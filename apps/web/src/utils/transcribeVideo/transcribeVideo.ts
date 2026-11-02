

import axios from "axios";
import { clientLogger } from "../clientLogger/clientLogger";

// Payload the browser sends to request an AI lesson draft.
export type LessonDraftInput = {
    // Pending Cloudinary public_id of the lecture video
    publicId: string;
    courseId?: string;
    lessonId?: string;
    // Course context for the prompt, all optional
    title?: string;
    category?: string;
    level?: string;
    language?: string;
};

export async function requestLessonDraft(input: LessonDraftInput[]) {
    try {
        const response = await axios.post("/api/instructor/course/ai/lesson-draft", input);
        clientLogger.info("Transcription job queued", { status: response.status, message: response.data.message });
    } catch (error) {
        clientLogger.error("Failed to queue transcription job", { error });
        throw error;
    }
}