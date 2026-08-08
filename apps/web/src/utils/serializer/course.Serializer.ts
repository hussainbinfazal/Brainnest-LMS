import { CCourse } from "@/types/client";
import { serializeDocument } from "./serializeDocument";
import { ICourse } from "@repo/shared";


export function serializeCourse(course: ICourse): CCourse {
    return serializeDocument(course) as unknown as CCourse;
}

export function serializeCourses(courses: ICourse[]): CCourse[] {
    return serializeDocument(courses) as unknown as CCourse[];
}