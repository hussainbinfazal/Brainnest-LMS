import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextResponse } from "next/server";
import { Section, Course, connectDB, ICourse, ILesson, ISection, IUser, Lesson, validateMongooseId, ICategory, logger, checkUser, ADMIN_COURSE_UPDATE_USER_KEY, ADMIN_COURSE_UPDATE_IP_KEY, ADMIN_COURSE_DETAIL_IP_KEY, Category } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";
import { diffDocuments } from "@/lib/helpers/genericDiff";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { updateCourseSchema } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { checkIp } from "@repo/shared/server";
import { toSlug, USER_ROLE } from "@repo/shared";

const updateCourseBodySchema = updateCourseSchema;
export async function GET(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_DETAIL_IP_KEY.namespace, ADMIN_COURSE_DETAIL_IP_KEY.max, ADMIN_COURSE_DETAIL_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const session: Session | null = await auth()
        if (!session) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = session?.user;
        if (!user || user?.role !== USER_ROLE.INSTRUCTOR) { return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true); }
        const params = await context.params;
        const courseId = Array.isArray(params.courseId)
            ? params.courseId[0]
            : params.courseId;
        logger.info("This is the courseId for the admin in the GET route", { courseId: courseId })
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


export async function DELETE(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_DETAIL_IP_KEY.namespace, ADMIN_COURSE_DETAIL_IP_KEY.max, ADMIN_COURSE_DETAIL_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    try {
        const params = await context.params;
        const courseId = Array.isArray(params.courseId)
            ? params.courseId[0]
            : params.courseId;
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (user?.role !== USER_ROLE.INSTRUCTOR) { return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true); }
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


export async function PATCH(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_UPDATE_IP_KEY.namespace, ADMIN_COURSE_UPDATE_IP_KEY.max, ADMIN_COURSE_UPDATE_IP_KEY.windowSec);

    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    const authSession: Session | null = await auth()
    if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
    const sessionUser: ISessionUser | null = authSession?.user;
    if (sessionUser?.role !== USER_ROLE.INSTRUCTOR) {
        logger.warn("Unauthorized access attempt in admin course update route");
        return failResponse({ message: "You are not authorized" }, 401, undefined, undefined, true);
    };
    const userId: string = sessionUser.id
    const { allowed: userAllowed, retryAfterSec: userRetryAfterSec } = await checkUser(userId, ADMIN_COURSE_UPDATE_USER_KEY.namespace, ADMIN_COURSE_UPDATE_USER_KEY.max, ADMIN_COURSE_UPDATE_USER_KEY.windowSec);
    if (!userAllowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(userRetryAfterSec) }, true);
    const session = await mongoose.startSession()
    await connectDB(process.env.MONGODB_URI!);
    try {
        const params = await context.params;
        const courseId = Array.isArray(params.courseId)
            ? params.courseId[0]
            : params.courseId;
        if (!courseId || !validateMongooseId({ courseId: courseId })) {
            logger.warn("Course id is required in admin course update route");
            return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        }
        const parsedBody = await parseBody(request, updateCourseBodySchema);
        if (!parsedBody.ok) return parsedBody.response;
        const body = parsedBody.data;
        const {
            sections,
            topics,
            faq,
            requirements,
            whatYouWillLearn,
            ...courseFields
        } = body;
        const course: ICourse | null = await Course.findOne({ _id: courseId, instructorId: sessionUser.id });
        if (!course) {
            logger.warn("Course not found in admin course update route with this Id", { courseId: courseId });
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        }
        const sectionWithIds = body.sections.map((section) => ({ ...section, _id: section._id || new mongoose.Types.ObjectId(), courseId: course._id }))
        const lessonsWithIds = sectionWithIds.flatMap((section) => (section.lessons ?? []).map((lesson) => ({ ...lesson, _id: lesson._id || new mongoose.Types.ObjectId(), sectionId: section._id, courseId: course._id })));
        // Ensure that the instructor can only update their own course and make this compatible with the new schema changes


        await session.withTransaction(async () => {
            const existingLessons = await Lesson.find({ course: course._id }).lean()
            const lessonDiff = diffDocuments(existingLessons, lessonsWithIds, ["name", "videoUrl", "durationInSeconds", "description", "isPreview", "previewUrl", "order", 'sectionId', 'courseId']);
            const totalDurationInSeconds = parseInt(lessonsWithIds.reduce((acc, lesson) => acc + (lesson.durationInSeconds || 0), 0).toString());
            const totalLessons = lessonsWithIds.length;
            const totalSections = body.sections.length;
            if (lessonDiff.toInsert.length) {
                await Lesson.insertMany(lessonDiff.toInsert, { session });
            }

            if (lessonDiff.toUpdate?.length) {
                const lessonOps = lessonDiff.toUpdate.map((doc) => ({
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
            const parentName = body.category.name;
            const childName = body.subCategory;

            const categoryNames = [parentName, childName].filter(
                (name): name is string => name !== undefined
            );

            const existingCategories = await Category.find({
                name: { $in: categoryNames },
            })
                .populate({ path: "parent", select: "name" })
                .session(session)
                .lean()
                .exec();

            const existingParentCategory = existingCategories.find(
                (category) => category.name === parentName
            );

            const existingChildCategory = existingCategories.find(
                (category) => category.name === childName
            );
            const parentId = existingParentCategory?._id ?? new mongoose.Types.ObjectId();
            const operations = [];
            if (!existingParentCategory) {
                operations.push({
                    updateOne: {
                        filter: { name: parentName, parent: null },
                        update: {
                            $setOnInsert: {
                                _id: parentId,
                                name: parentName,
                                slug: toSlug(parentName),
                                parent: null
                            }
                        }

                    },
                    upsert: true
                });
            }
            if (!existingChildCategory) {
                operations.push({
                    updateOne: {
                        filter: { name: childName, parent: parentId },
                        update: {
                            $setOnInsert: {
                                name: childName,
                                slug: toSlug(childName),
                                parent: parentId,
                            },
                        },
                        upsert: true,
                    },
                });
            }
            if (operations.length > 0) {
                await Category.bulkWrite(operations, { session, ordered: true });
            }
            const existingSections = await Section.find({ courseId: course._id }).session(session);
            const sectionsDiff = diffDocuments(existingSections, sectionWithIds, ["title", "description", "order", 'courseId']);
            if (sectionsDiff.toInsert.length) {
                await Section.insertMany(sectionsDiff.toInsert, { session });
            }
            if (sectionsDiff.toUpdate.length) {
                const sectionOps = sectionsDiff.toUpdate.map((section) => ({
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
                ...courseFields,
                totalDurationInSeconds,
                totalLessons,

            };
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

export async function PATCH(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
    const params = await context.params
    const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
    const { allowed, remaining, retryAfterSec, ip } = await checkIp(
        request,
        ADMIN_COURSE_UPDATE_IP_KEY.namespace,
        ADMIN_COURSE_UPDATE_IP_KEY.max,
        ADMIN_COURSE_UPDATE_IP_KEY.windowSec
    );
    if (!allowed)
        return failResponse(
            { message: "Too many requests" },
            429,
            undefined,
            { "Retry-After": String(retryAfterSec) },
            true
        );


    ///Every asset that must move out of the pending folders

    const authSession: Session | null = await auth();
    if (!authSession)
        return failResponse(
            { message: "Unauthorized", ip: ip },
            401,
            undefined,
            undefined,
            true
        );
    const userInSession: ISessionUser | null = authSession?.user;
    const parsedBody = await parseBody(request, updateCourseBodySchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    if (!userInSession || !validateMongooseId({ userId: userInSession.id })) {
        logger.warn("Unauthorized access attempt to update course", { ip: ip });
        return failResponse(
            { message: "Unauthorized" },
            401,
            undefined,
            undefined,
            true
        );
    }
    logger.info("This is the user is attempting to update course ", {
        name: userInSession.name,
        id: userInSession.id,
    });
    const sessionUserId: string = userInSession.id;

    const {
        allowed: isUserAllowed,
        remaining: remainingAttempts,
        retryAfterSec: retryAfter,
    } = await checkUser(
        userInSession.id,
        ADMIN_COURSE_UPDATE_USER_KEY.namespace,
        ADMIN_COURSE_UPDATE_USER_KEY.max,
        ADMIN_COURSE_UPDATE_USER_KEY.windowSec
    );

    if (!isUserAllowed) {
        return failResponse(
            { message: "Too many requests" },
            429,
            undefined,
            { "Retry-After": String(retryAfter) },
            true
        );
    }
    const pendingAssets: PendingAsset[] = [
        ///Course cover is an image ( the old code treated it as a video)
        {
            publicId: body.coverPublicId,
            kind: "image",
            pendingPrefix: uploadFolder(
                TOPIC_FOLDER["thumbnail"],
                PENDING_THUMBNAIL_SUBFOLDER
            ),
            targetPublicId: uploadTargetPublicId(
                TOPIC_FOLDER["thumbnail"],
                courseId.toString()
            ),
        },
        ///// Course preview video
        {
            publicId: body.previewVideoPublicId,
            kind: "video",
            pendingPrefix: uploadFolder(
                TOPIC_FOLDER["preview-video"],
                PENDING_PREVIEW_VIDEO_SUBFOLDER
            ),
            targetPublicId: uploadTargetPublicId(
                TOPIC_FOLDER["preview-video"],
                courseId.toString()
            ),
        },
        ///// lesson Lecture Videos
    ];
    await connectDB(process.env.MONGODB_URI!);
    if (!courseId || !validateMongooseId({ courseId })) {
        logger.warn("Invalid courseId provided for update", { courseId: courseId });
        return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
    }
    try {
        const existingCourse = await Course.find({ _id: courseId }).lean();
        const sectionWithIds = body.sections.map((section, sIdx) => ({
            ...section,
            _id: section._id,
            courseId: new Types.ObjectId(courseId),
        }))
        const lessonWithIds = body.sections.flatMap((section, sIdx) => section.lessons?.map((lesson, lIdx) => ({
            _id: lesson._id,
            sectionId: new Types.ObjectId(section._id),
            courseId: new Types.ObjectId(courseId),
            ...lesson
        }));

        body.sections.forEach((section, sIdx) => {
            section.lessons?.forEach((lesson, lIdx) => {
                // Unique folder per lesson so names never collide
                const lessonFinal = uploadTargetPublicId(
                    TOPIC_FOLDER["lecture-video"],
                    `c${courseId.toString()}-s${sIdx.toString()}-l${lIdx.toString()}`
                );
                const previewLessonFinal = uploadTargetPublicId(
                    TOPIC_FOLDER["lecture_preview-video"],
                    `c${courseId.toString()}-s${sIdx.toString()}-l${lIdx.toString()}`
                );
                // Main lecture video
                if (lesson.videoPublicId) {
                    pendingAssets.push({
                        publicId: lesson.videoPublicId,
                        kind: "video",
                        pendingPrefix: uploadFolder(
                            TOPIC_FOLDER["lecture-video"],
                            PENDING_LECTURES_SUBFOLDER
                        ),
                        targetPublicId: lessonFinal,
                    });
                }
                // Optional preview clip
                if (lesson.previewPublicId) {
                    pendingAssets.push({
                        publicId: lesson.previewPublicId,
                        kind: "video",
                        pendingPrefix: uploadFolder(
                            TOPIC_FOLDER["lecture_preview-video"],
                            PENDING_PREVIEW_LECTURES_SUBFOLDER
                        ),
                        targetPublicId: previewLessonFinal,
                    });
                }
            });
        });

        ///Verfiy all the assets
        try {
            await verifyAssets(pendingAssets);
        } catch (err: unknown) {
            console.error("This is the error in verifyAsset function ", err, err instanceof Error ? err.message : "Unknown error");
            const status = err instanceof AssetError ? err.status : 500;
            // Safe to show: AssetError messages never contain Cloudinary internals
            console.log("This is the error in asset verification ", err)
            const message =
                err instanceof AssetError ? err.message : "Asset verification failed";
            logger.error("verifyAssets failed in course create route", {
                // The real message
                message: err instanceof Error ? err.message : String(err),
                // The stack shows the exact line that threw
                stack: err instanceof Error ? err.stack : undefined,
            })
            return failResponse({ message }, status, undefined, undefined, true);
        }


        ///Move files from pending to final
        let moved: Map<string, MovedAsset>;
        try {
            moved = await moveAssets(pendingAssets); ///Move all the pending assets
        } catch (err: unknown) {
            console.error("This is the error in moveAssets", err, err instanceof Error ? err.message : "Unknown error");

            // Same mapping as above
            const status = err instanceof AssetError ? err.status : 500;
            logger.error("This is the error in move Asset process in the course create route,", { error: err })
            return failResponse(
                { message: "Failed to process uploaded files" },
                status,
                undefined,
                undefined,
                true
            );
        }
        // Small helper: pending public_id -> final URL
        // Look up the moved asset for this pending id
        const urlOf = (pendingId: string): string => {
            // Get the entry from the move results
            const asset = moved.get(pendingId);
            // Fail loudly with the id, instead of a vague TypeError
            if (!asset) {
                logger.error("Asset not present in the moved state,")
                throw new Error(`No moved asset for ${pendingId}`);
            }
            // Return the final HTTPS URL
            return asset.url;
        };
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                console.log("📦 Received payload:", JSON.stringify(body, null, 2));
                ///Normailze names once
                const parentName: string = body.category.name.trim().toLowerCase();
                const subName: string = body.subCategory.trim().toLowerCase();
                console.log("🏷️ Parent category name:", parentName);
                console.log("🔗 Parent category slug:", toSlug(parentName));

                //Upsert Parent cateogry
                const parentCategory: ICategory = await Category.findOneAndUpdate(
                    { name: parentName, parent: null },
                    {
                        $setOnInsert: { name: parentName, slug: toSlug(parentName) },
                        parent: null,
                    },
                    { upsert: true, returnDocument: "after", session }
                );

                // let parentCategory = await Category.findOne({
                //   slug: toSlug(parentName),
                //   parent: null
                // });

                // if (!parentCategory) {
                //   parentCategory = await Category.create({  // ❌ Crashes if slug exists
                //     // name: parentName,
                //     slug: toSlug(parentName),
                //     parent: null,
                //   });
                // }
                ////Upsert the subcategory under the same parent
                const subCategory: ICategory = await Category.findOneAndUpdate(
                    { name: subName, parent: parentCategory._id },
                    {
                        $setOnInsert: {
                            name: subName,
                            slug: toSlug(subName),
                            parent: parentCategory._id,
                        },
                    },
                    { upsert: true, returnDocument: "after", session }
                );

                // let subCategory = await Category.findOne({
                //   slug: toSlug(subName),
                //   parent: parentCategory._id
                // });

                // if (!subCategory) {
                //   subCategory = await Category.create({  // ❌ Crashes if slug exists
                //     // name: subName,
                //     slug: toSlug(subName),
                //     parent: parentCategory._id,
                //   });
                // }

                ///Duplicate Topics under normalized name
                const topicMap: Map<string, { name: string; description: string }> =
                    new Map<string, { name: string; description: string }>();

                ///Last one wins on dupllicates
                body.topics.forEach((t) =>
                    topicMap.set(t.name.trim().toLowerCase(), {
                        name: t.name.trim(),
                        description: t.description ?? '',
                    })
                );

                //Upsert  in one round trip instead of find + insertmany ( which  races under concurrent requests)
                if (topicMap.size > 0) {
                    await Topic.bulkWrite(
                        [...topicMap.values()].map((t) => ({
                            updateOne: {
                                filter: { name: t.name },
                                update: {
                                    $setOnInsert: {
                                        name: t.name,
                                        description: t.description,
                                        slug: toSlug(t.name),
                                        isActive: true,
                                    },
                                },
                                upsert: true,
                            },
                        })),
                        { session }
                    );
                }
                // if (topicMap.size > 0) {
                //   for (const topic of topicMap.values()) {
                //     // Check if exists
                //     let existingTopic = await Topic.findOne({ name: topic.name });

                //     if (!existingTopic) {
                //       const name: string = topic.name;
                //       const description: string = topic.description;
                //       const slug: toSlug(topic.name);

                //       // Create if not exists
                //       await Topic.create(topic);
                //     }
                //   }
                // }
                // Read back the ids of all topics for this course

                const topicDocs: ITopic[] = await Topic.find({
                    name: { $in: [...topicMap.keys()] },
                })
                    .select("_id")
                    .session(session)
                    .lean();

                ///Pre Assingn section Ids so lessons can reference them without index guessing
                const sectionDocs: (ISection)[] = body.sections.map((s) => ({
                    _id: s._id ? new Types.ObjectId(s._id) : new Types.ObjectId(),
                    courseId: new Types.ObjectId(courseId),
                    title: s.title,
                    description: s.description,
                    order: s.order,

                }));
                ///Flatten lessons while keeping the each one linked to its section
                const lessonDocs: ILesson[] = body.sections.flatMap((s, sIndex) =>
                    s.lessons.map((l, lIndex) => ({
                        _id: l._id ? new Types.ObjectId(l._id) : new Types.ObjectId(),
                        sectionId: sectionDocs[sIndex]._id,
                        courseId,
                        name: l.name,
                        description: l.description,
                        videoUrl: urlOf(l.videoPublicId),
                        isPreview: l.isPreview,
                        previewUrl: l.previewPublicId ? urlOf(l.previewPublicId) : undefined,
                        durationInSeconds: l.durationInSeconds,
                        order: l.order,
                    }))
                );

                // Totals are computed on the server, never trusted from the client
                const totalDurationInSeconds: number = lessonDocs.reduce(
                    (sum, l) => sum + l.durationInSeconds,
                    0
                );

                // Create the course once, with totals included (no second save needed)
                const [course] = (await Course.create(
                    [
                        {
                            _id: courseId,
                            title: body.title,
                            description: body.description,
                            price: body.price,
                            discount: body.discount,
                            category: subCategory._id,
                            dripType: body.dripType,
                            faq: body.faq,
                            requirements: body.requirements,
                            whatYouWillLearn: body.whatYouWillLearn,
                            previewVideo: urlOf(body.previewVideoPublicId),
                            coverImage: urlOf(body.coverPublicId),
                            status: body.status,
                            totalDurationInSeconds,
                            totalLessons: lessonDocs.length,
                            language: body.language,
                            level: body.level,
                            certificate: body.certificate,
                            tags: body.tags,
                            // Starts at zero; enrollment jobs update it later
                            totalEnrolledCount: 0,
                            // Instructor comes from the session, never from the body
                            instructorId: userInSession.id,
                            topics: topicDocs.map((t) => t._id),
                        },
                    ],
                    { session }
                )) as ICourse[];

                (await Section.insertMany(sectionDocs, { session })) as ISection[];
                (await Lesson.insertMany(lessonDocs, { session })) as ILesson[];

                ///Keep the  result for response
                createdCourse = course;
            });
        } catch (error: unknown) {
            console.error("This is the error in admin course route", error, error instanceof Error ? error.message : "Unknown error");
            await rollbackMoves([...moved.values()]);
            logger.error("Error in creating course", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            const message = error instanceof Error ? error.message : "Unknown error";
            return failResponse(
                { message: `Error in creating course` },
                500,
                undefined,
                undefined,
                true
            );
        } finally {
            await session.endSession();
        }

        logger.info("Course created successfully", {
            courseId: courseId.toString(),
            instructorId: sessionUserId,
        });
        await invalidateCached(COURSES_ALL.namespace, "all");
        return successResponse(
            { message: "Course created successfully", course: createdCourse },
            201,
            undefined,
            undefined,
            true
        );
    }
