///Schemas
export * from './schemas/auth.schema'

export const USER_ROLE: Record<string, string> = {
    ADMIN: "admin",
    INSTRUCTOR: "instructor",
    STUDENT: "student"
}