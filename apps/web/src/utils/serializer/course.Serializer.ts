import { CCourse } from "@/types/client";
import { serializeDocument } from "./serializeDocument";
import { ICourse } from "@/types/model";

export function serializeCourse(course: ICourse): CCourse {
    return serializeDocument(course) as unknown as CCourse;
}

export function serializeCourses(courses: ICourse[]): CCourse[] {
    return serializeDocument(courses) as unknown as CCourse[];
}