import { ILessonProgress } from "@repo/shared";
import { serializeDocument } from "./serializeDocument";
import { CLessonProgress, CProgress } from "@/types/client";


export function serializeLessonProgress(lessonProgress: ILessonProgress): CLessonProgress {
    return serializeDocument(lessonProgress) as unknown as CLessonProgress;
}

export function serializeLessonsProgress(lessonProgress: ILessonProgress[]): CLessonProgress[] {
    return serializeDocument(lessonProgress) as unknown as CLessonProgress[];
}