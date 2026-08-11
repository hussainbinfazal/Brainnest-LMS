import { ILesson } from "@repo/shared";
import { serializeDocument } from "./serializeDocument";
import { CLesson } from "@/types/client";


export function serializeLesson(lesson: ILesson): CLesson {
    return serializeDocument(lesson) as unknown as CLesson;
}

export function serializeLessons(lessons: ILesson[]): CLesson[] {
    return serializeDocument(lessons) as unknown as CLesson[];
}