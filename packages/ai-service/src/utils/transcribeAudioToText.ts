import { logger } from "@repo/shared/server";
import { toFile } from "groq-sdk";
import { voiceLLM } from "../LLM/llm";

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
export async function transcribeVideoToText({
    userId,
    courseId,
    lessonId,
    mp3Url,
}: {
    userId: string;
    courseId?: string;
    lessonId?: string;
    mp3Url: string;
}) {
    const res = await fetch(mp3Url, { signal: AbortSignal.timeout(120_000) });
    // Throw on any non-200 so BullMQ retries (Cloudinary answers 423 while still generating)
    if (!res.ok) {
        logger.error("Error in Transcription", {
            status: res.status
        })
        throw new Error(`Audio download failed: ${res.status}`);
    }
    console.log("This is the response in transcribeVideoToText", res);
    // Read the whole body into memory
    const buffer = Buffer.from(await res.arrayBuffer());
    // Fail clearly instead of letting the API reject an oversized file
    if (buffer.length > MAX_AUDIO_BYTES) {
        logger.error("Audio too large for transcription", {
            size: buffer.length,
            maxSize: MAX_AUDIO_BYTES,
        });
        // TODO: split the audio into chunks for long lessons
        throw new Error(`Audio too large: ${buffer.length} bytes`);
    }
    const file = await toFile(buffer, `${lessonId}.mp3`, { type: "audio/mpeg" });

    const transcription = await voiceLLM.audio.transcriptions.create({
        file,
        model: "whisper-large-v3",
        temperature: 0,
        response_format: "verbose_json",
    });
    console.log("This is the transcription in transcribeVideoToText", transcription);
    logger.info("Transcription on audio completed on package");
    return {
        courseId,
        lessonId,
        transcript: transcription.text,
        segments: (transcription as { segments?: unknown[] }).segments ?? [],
    };
};
