import Progress from "@/models/Course/progressModel";
import UserCourse from "@/models/User/userCourse";
import { IProgress } from "@/types/model";
import { logger } from "@/utils/logger/logger.node";
import mongoose from "mongoose";


export async function generateProgress(userId: string, courseId: string,) {
    try {

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            logger.info("Invalid user id");
            return
        }
        if (!courseId) {
            logger.info("Course and lesson IDs are required");
            return
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            logger.info("Invalid course or Lesson ID")
            return
        };
        let progress: IProgress | null = await Progress.findOne({ userId, courseId })
        if (!progress) {
            progress = new Progress({ userId, courseId })
            await progress.save();
        }
        logger.info("Progress of the Lesson created in worker", { progress });
    }
    catch (err: any) {
        logger.error("Error in generating certificate");
        throw new Error(err)
    }
}


export async function updateProgress(userId: string, courseId: string, lessonId: string, progressValue: number) {
    try {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            logger.info("Invalid user id");
            return
        }
        if (!courseId) {
            logger.info("Course and lesson IDs are required");
            return
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            logger.info("Invalid course or Lesson ID")
            throw new Error("Invalid CourseId")
        };
        if (!lessonId) {
            logger.info("Lesson ID is required");
            throw new Error("Lesson Id and course Id is required")
        }
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            logger.info("Invalid lesson ID");
            throw new Error("Invalid Lesson Id")
        }


        const update = await Progress.findOneAndUpdate({ userId, courseId }, [
            {
                $set: {
                    completedLessons: {
                        $ifNull: ["$completedLessons", []]
                    }
                }
            },
            {
                $set: {
                    completedLessons: {
                        $map: {
                            input: "$completedLesssons",
                            as: "l",
                            in: {
                                $cond: [
                                    { $eq: "$$l.lessonId" },
                                    { lessonId, progress: progressValue },
                                    "$$l"
                                ]
                            }
                        }
                    },
                }
            },
            {
                $set: {
                    completedLessons: {
                        $cond: [
                            lessonId,
                            {
                                $map: {
                                    input: "$completedLessons",
                                    as: "l",
                                    in: "$$l.lessonId"
                                }
                            },
                            "$completedLessons",
                            {
                                $concatArrays: [
                                    "$completedLessons",
                                    [{ lessonId, progress: progressValue }]
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "lessons",
                    localfield: "courseId",
                    foreignField: "courseId",
                    as: "lessonsData"
                }
            },
            {
                $set: {
                    totalLessons: {
                        $size: "$lessonsData"
                    }
                }
            },
            {
                $set: {
                    percentageCompleted: {
                        $cond: [
                            { $eq: ["totalLessons", 0] },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: "$completedLessons",
                                                        as: "l",
                                                        cond: {
                                                            $eq: ["$$l.progress", 100]
                                                        }
                                                    }
                                                }
                                            },
                                            "$totalLessons"
                                        ]
                                    },
                                    100
                                ]
                            }
                        ]
                    }
                }
            }

        ], { upsert: true, new: true });
        await UserCourse.findOneAndUpdate({ userId, courseId }, { $set: { progress: update.percentageCompleted } }, { upsert: true });

        let percentageCompleted = update?.percentageCompleted
        logger.info("Progress Updated (pipeline)", {
            lessonId,
            progressValue,
            progressPercentage: percentageCompleted
        });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in updating progress in worker pipeline", { message });
        throw new Error(error)

    }
}