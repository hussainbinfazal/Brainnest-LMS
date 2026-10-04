import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextResponse } from "next/server";
import { Section, Course, connectDB, ICourse, ILesson, ISection, IUser, Lesson, validateMongooseId, ICategory, logger } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";
import { diffDocuments } from "@/lib/helpers/genericDiff";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
import { ADMIN_COURSE_DETAIL_IP_KEY, checkIp } from "@repo/shared/server";

const updateCourseBodySchema = z.record(z.string(), z.any());
export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_DETAIL_IP_KEY.namespace, ADMIN_COURSE_DETAIL_IP_KEY.max, ADMIN_COURSE_DETAIL_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const session: Session | null = await auth()
        if (!session) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = session?.user;
        if (!user || user?.role !== "instructor") { return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true); }
        const { courseId } = context.params;
        logger.info("This is the courseId for the admin in the edit route", { courseId: courseId })
        if (!courseId || !validateMongooseId({ courseId })) {
            return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        }
        await connectDB(process.env.MONGODB_URI!);
        const course: ICourse | null = await Course.findById(courseId).lean();

        if (!course) {
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        }

        const completeCourse = await Course.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category",

            },
            {
                $lookup: {
                    from: "categories",
                    let: {
                        parentId: "$category.parent"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$parentId"]
                                }
                            }
                        }
                    ],


                    as: "subCategory"
                }
            },
            {
                $lookup: {
                    from: "lessons",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$course", "$$courseId"]
                                }
                            }

                        },

                        {
                            $sort: { order: 1 }
                        }

                    ],
                    as: "lessons"
                }
            },
            {
                $lookup: {
                    from: "sections",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$course", "$$courseId"]
                                }
                            }
                        },
                        {
                            $sort: { order: 1 }
                        }
                    ],
                    as: "sections"
                }
            },
        ]);
        logger.info("Course retrieved successfully");
        return successResponse({
            course: completeCourse,
        }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting course:", { message: message });
        return failResponse({ message: `Error in getting course` }, 500, undefined, undefined, true);
    }
}


export async function DELETE(request: CustomNextRequest, { params }: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_DETAIL_IP_KEY.namespace, ADMIN_COURSE_DETAIL_IP_KEY.max, ADMIN_COURSE_DETAIL_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const { courseId } = params;
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (user?.role !== "instructor") { return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true); }
        if (!courseId || !validateMongooseId({ courseId })) {
            return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        }
        await connectDB(process.env.MONGODB_URI!);
        const course: ICourse | null = await Course.findByIdAndDelete(courseId);

        if (!course) {
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        }
        logger.info("Course deleted successfully");
        return successResponse({ message: "Course deleted successfully" }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        logger.error(`Error in deleting course: ${message}`);
        return failResponse({ message: `Error in deleting course:${message}` }, 500, undefined, undefined, true);
    }
}


export async function PUT(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_DETAIL_IP_KEY.namespace, ADMIN_COURSE_DETAIL_IP_KEY.max, ADMIN_COURSE_DETAIL_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession()
    try {
        const { courseId } = context.params;
        const parsedBody = await parseBody(request, updateCourseBodySchema);
        if (!parsedBody.ok) return parsedBody.response;
        const body = parsedBody.data;
        const {
            lessons,
            sections,
            topics,
            faq,
            requirements,
            whatYouWillLearn,
            ...courseFields
        } = body;
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const sessionUser: ISessionUser | null = authSession?.user;

        if (sessionUser?.role !== "instructor") {
            logger.warn("Unauthorized access attempt in admin course update route");
            return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true);
        }
        if (!courseId || !validateMongooseId({ courseId: courseId })) {
            logger.warn("Course id is required in admin course update route");
            return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        }
        const course: ICourse | null = await Course.findOne({ _id: courseId, instructorId: sessionUser.id });
        if (!course) {
            logger.warn("Course not found in admin course update route with this Id", { courseId: courseId });
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        }
        // Ensure that the instructor can only update their own course and make this compatible with the new schema changes


        await session.withTransaction(async () => {
            const existingLessons: ILesson[] = await Lesson.find({ course: course._id }).lean()
            const lessonDiff = diffDocuments(existingLessons, body.lessons, ["name", "videoUrl", "durationInSeconds", "description", "isPreview", "previewUrl", "order"]);
            const categoryToBeUpdate: ICategory = body.category;
            const subCategoryToBeUpdate = body.subCategory;
            if (lessonDiff.toInsert.length) {
                await Lesson.insertMany(lessonDiff.toInsert, { session });
            }

            if (lessonDiff.toUpdate?.length) {
                const lessonOps = lessonDiff.toUpdate.map((doc: ILesson) => ({
                    updateOne: {
                        filter: { _id: doc._id },
                        update: { $set: doc }
                    }
                }))
                await Lesson.bulkWrite(lessonOps, { session });
            }

            if (lessonDiff.toDelete.length) {
                await Lesson.deleteMany({
                    _id: {
                        $in: lessonDiff.toDelete
                    }
                }, { session })
            }
            const existingSections: ISection[] = await Section.find({ courseId: course._id }).session(session);
            const sectionsDiff = diffDocuments(existingSections, body.sections, ["title", "description", "order"]);
            if (sectionsDiff.toInsert.length) {
                await Section.insertMany(sectionsDiff.toInsert, { session });
            }
            if (sectionsDiff.toUpdate.length) {
                const sectionOps = sectionsDiff.toUpdate.map((section: ISection) => ({
                    updateOne: {
                        filter: { _id: section._id },
                        update: { $set: section }
                    }
                }))
                await Section.bulkWrite(sectionOps, { session })
            }
            if (sectionsDiff.toDelete.length) {
                await Section.deleteMany({
                    _id: {
                        $in: sectionsDiff.toDelete
                    }
                }, { session })
            }
            const coursePayload: Partial<ICourse> = {
                ...courseFields
            };

            if (categoryToBeUpdate) coursePayload.category = categoryToBeUpdate;
            if (subCategoryToBeUpdate) coursePayload.subCategory = subCategoryToBeUpdate;

            if (Object.keys(coursePayload).length) {
                await Course.updateOne(
                    { _id: courseId },

                    { $set: coursePayload },
                    { session }
                );
            }
        })

        logger.info("Course updated successfully");
        return successResponse({ message: "Course updated successfully" }, 200, undefined, undefined, true);
    } catch (error: unknown) {

        const message = error instanceof Error ? error.message : 'Internal server error';
        logger.error(`Error in updating course: ${message}`);
        return failResponse({ message: `Error in updating course:${message}` }, 500, undefined, undefined, true);
    } finally {
        session.endSession()
    }
}