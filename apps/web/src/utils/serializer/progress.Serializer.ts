import { IProgress } from "@repo/shared";
import { serializeDocument } from "./serializeDocument";
import { CProgress } from "@/types/client";


export function serializeProgress(progress: IProgress): CProgress {
    return serializeDocument(progress) as unknown as CProgress;
}

export function serializeProgresses(progress: IProgress[]): CProgress[] {
    return serializeDocument(progress) as unknown as CProgress[];
}