
///Schemas
export * from './schemas/auth.schema'

export const USER_ROLE: Record<string, string> = {
    ADMIN: "admin",
    INSTRUCTOR: "instructor",
    STUDENT: "student"
}

export const COURSE_LEVEL: Record<string, string> = {
    BEGINNER: "beginner",
    INTERMEDIATE: "intermediate",
    ADVANCED: "advanced"
}