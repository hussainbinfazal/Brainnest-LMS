import { NextResponse } from "next/server";
import {Section,Course, connectDB, ICourse, ILesson, ISection, IUser, Lesson, validateMongooseId, ICategory } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";  
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger.node";
import mongoose from "mongoose";
import { diffDocuments } from "@/lib/helpers/genericDiff";

export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {

        const user: ISessionUser | null = await getDataFromToken(request);

        if (!user || user?.role !== "instructor") { return NextResponse.json({ message: "You are not authorized" }, { status: 401 }); }
        const { courseId } = context.params;
        logger.info("This is the courseId for the admin in the edit route", { courseId: courseId })
        if (!courseId || !validateMongooseId({ courseId })) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        const course: ICourse | null = await Course.findById(courseId).lean();

        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
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
        return NextResponse.json({
            course: completeCourse,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting course:", { message: message });
        return NextResponse.json({ message: `Error in getting course` }, { status: 500 });
    }
}


export async function DELETE(request: CustomNextRequest, { params }: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const { courseId } = params;
        const user: ISessionUser | null = await getDataFromToken(request);
        if (user?.role !== "instructor") { return NextResponse.json({ message: "You are not authorized" }, { status: 401 }); }
        if (!courseId || !validateMongooseId({ courseId })) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        const course: ICourse | null = await Course.findByIdAndDelete(courseId);

        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }
        logger.info("Course deleted successfully");
        return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        logger.error(`Error in deleting course: ${message}`);
        return NextResponse.json({ message: `Error in deleting course:${message}` }, { status: 500 });
    }
}


export async function PUT(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession()
    try {
        const { courseId } = context.params;
        const body = await request.json();
        const {
            lessons,
            sections,
            topics,
            faq,
            requirements,
            whatYouWillLearn,
            ...courseFields
        } = body;
        const sessionUser: ISessionUser | null = await getDataFromToken(request);

        if (sessionUser?.role !== "instructor") {
            logger.warn("Unauthorized access attempt in admin course update route");
            return NextResponse.json({ message: "You are not authorized" }, { status: 401 });
        }
        if (!courseId || !validateMongooseId({ courseId: courseId })) {
            logger.warn("Course id is required in admin course update route");
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        const course: ICourse | null = await Course.findOne({ _id: courseId, instructorId: sessionUser.id });
        if (!course) {
            logger.warn("Course not found in admin course update route with this Id", { courseId: courseId });
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }
        // Ensure that the instructor can only update their own course and make this compatible with the new schema changes


        await session.withTransaction(async () => {
            const existingLessons: ILesson[] = await Lesson.find({ course: course._id }).lean()
            const lessonDiff= diffDocuments(existingLessons, body.lessons, ["name", "videoUrl", "durationInSeconds", "description", "isPreview", "isPreviewVideo", "order"]);
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
            const existingSections : ISection[] = await Section.find({ courseId: course._id }).session(session);
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
        return NextResponse.json({ message: "Course updated successfully" });
    } catch (error: unknown) {

        const message = error instanceof Error ? error.message : 'Internal server error';
        logger.error(`Error in updating course: ${message}`);
        return NextResponse.json({ message: `Error in updating course:${message}` }, { status: 500 });
    } finally {
        session.endSession()
    }
}