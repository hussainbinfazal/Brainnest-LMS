import { ISection } from "@repo/shared";
import { serializeDocument } from "./serializeDocument";
import { CSection } from "@/types/client";


export function serializeSection(section: ISection): CSection {
    return serializeDocument(section) as unknown as CSection;
}

export function serializeSections(sections: ISection[]): CSection[] {
    return serializeDocument(sections) as unknown as CSection[];
}