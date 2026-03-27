import mongoose from "mongoose";

export function validateMongooseId({
    userId,
    courseId,
    lessonId,
    reviewId

}: {
    userId?: string,
    courseId?: string,
    lessonId?: string,
    reviewId?: string
}): boolean {
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user id")
    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) throw new Error("Invalid course id")
    if (lessonId && !mongoose.Types.ObjectId.isValid(lessonId)) throw new Error("Invalid lesson id")
    if (reviewId && !mongoose.Types.ObjectId.isValid(reviewId)) throw new Error("Invalid review id")
    return true

}