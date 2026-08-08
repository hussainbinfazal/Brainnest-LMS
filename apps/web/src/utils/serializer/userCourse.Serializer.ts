import { CCourse, CUserCourse } from "@/types/client";
import { serializeDocument } from "./serializeDocument";
import { IUserCourse } from "@repo/shared";

export function serializeUserCourses(userCourse: IUserCourse[]): CUserCourse[] {
    return serializeDocument(userCourse) as unknown as CUserCourse[];
}
export function serializeUserCourse(userCourse: IUserCourse): CUserCourse {
    return serializeDocument(userCourse) as unknown as CUserCourse;
}