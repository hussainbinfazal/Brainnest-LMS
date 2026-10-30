import {
    failResponse,
    successResponse,
} from "@/lib/helpers/failResponseHelper";
import { NextResponse } from "next/server";
import {
    Section,
    Course,
    connectDB,
    ICourse,
    ILesson,
    ISection,
    IUser,
    Lesson,
    validateMongooseId,
    ICategory,
    logger,
    checkUser,
    ADMIN_COURSE_UPDATE_USER_KEY,
    ADMIN_COURSE_UPDATE_IP_KEY,
    ADMIN_COURSE_DETAIL_IP_KEY,
    Category,
    ITopic,
    Topic,
    Enrollment,
    invalidateCached,
    COURSES_ALL,
    INSTRUCTOR_COURSE_WITH_ID,
} from "@repo/shared/server";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose, { Types } from "mongoose";
import { diffDocuments } from "@/lib/helpers/genericDiff";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { updateCourseSchema } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { checkIp } from "@repo/shared/server";
import {
    PENDING_LECTURES_SUBFOLDER,
    PENDING_PREVIEW_LECTURES_SUBFOLDER,
    PENDING_PREVIEW_VIDEO_SUBFOLDER,
    PENDING_THUMBNAIL_SUBFOLDER,
    TOPIC_FOLDER,
    toSlug,
    uploadFolder,
    uploadTargetPublicId,
    USER_ROLE,
} from "@repo/shared";
import {
    AssetError,
    moveAssets,
    MovedAsset,
    PendingAsset,
    rollbackMoves,
    verifyAssets,
} from "@/utils/CloudinaryAssets";
import { ClientSession } from "mongoose";
import { computeTotals, isPendingId, Lessonfields, PlannedLesson, PlannedSection, RequestError, resolveCategory, resolveTopic, stripUndefined, syncLessons, syncSections } from "./updateCourseHelpers";
const COVER_PENDING_PREFIX = uploadFolder(TOPIC_FOLDER["thumbnail"], PENDING_THUMBNAIL_SUBFOLDER);
// Same for the course preview video
const PREVIEW_PENDING_PREFIX = uploadFolder(TOPIC_FOLDER["preview-video"], PENDING_PREVIEW_VIDEO_SUBFOLDER);
// Same for lecture videos
const LECTURE_PENDING_PREFIX = uploadFolder(TOPIC_FOLDER["lecture-video"], PENDING_LECTURES_SUBFOLDER);
// Same for lecture preview clips
const LECTURE_PREVIEW_PENDING_PREFIX = uploadFolder(TOPIC_FOLDER["lecture_preview-video"], PENDING_PREVIEW_LECTURES_SUBFOLDER);
const updateCourseBodySchema = updateCourseSchema;
export async function GET(
    request: CustomNextRequest,
    context: { params: Promise<{ courseId: string | string[] }> }
): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(
        request,
        ADMIN_COURSE_DETAIL_IP_KEY.namespace,
        ADMIN_COURSE_DETAIL_IP_KEY.max,
        ADMIN_COURSE_DETAIL_IP_KEY.windowSec
    );
    if (!allowed)
        return failResponse(
            { message: "Too many requests" },
            429,
            undefined,
            { "Retry-After": String(retryAfterSec) },
            true
        );
    try {
        const session: Session | null = await auth();
        if (!session)
            return failResponse(
                { message: "Unauthorized", ip: ip },
                401,
                undefined,
                undefined,
                true
            );
        const user: ISessionUser | null = session?.user;
        if (!user || user?.role !== USER_ROLE.INSTRUCTOR) {
            return failResponse(
                { message: "You are not authorized" },
                401,
                undefined,
                undefined,
                true
            );
        }
        const params = await context.params;
        const courseId = Array.isArray(params.courseId)
            ? params.courseId[0]
            : params.courseId;
        logger.info("This is the courseId for the admin in the GET route", {
            courseId: courseId,
        });
        if (!courseId || !validateMongooseId({ courseId })) {
            return failResponse(
                { message: "Course id is required" },
                400,
                undefined,
                undefined,
                true
            );
        }
        await connectDB(process.env.MONGODB_URI!);
        const course: ICourse | null = await Course.findById(courseId).lean();

        if (!course || String(course?.instructorId) !== user.id) {
            return failResponse(
                { message: "Course not found" },
                404,
                undefined,
                undefined,
                true
            );
        }

        const completeCourse = await Course.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: "$category",
            },
            {
                $lookup: {
                    from: "categories",
                    let: {
                        parentId: "$category.parent",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$parentId"],
                                },
                            },
                        },
                    ],

                    as: "subCategory",
                },
            },
            {
                $lookup: {
                    from: "lessons",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$course", "$$courseId"],
                                },
                            },
                        },

                        {
                            $sort: { order: 1 },
                        },
                    ],
                    as: "lessons",
                },
            },
            {
                $lookup: {
                    from: "sections",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$course", "$$courseId"],
                                },
                            },
                        },
                        {
                            $sort: { order: 1 },
                        },
                    ],
                    as: "sections",
                },
            },
        ]);
        logger.info("Course retrieved successfully");
        return successResponse(
            {
                course: completeCourse,
            },
            200,
            undefined,
            undefined,
            true
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error in getting course:", { message: message });
        return failResponse(
            { message: `Error in getting course` },
            500,
            undefined,
            undefined,
            true
        );
    }
}

export async function DELETE(
    request: CustomNextRequest,
    context: { params: Promise<{ courseId: string | string[] }> }
): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(
        request,
        ADMIN_COURSE_DETAIL_IP_KEY.namespace,
        ADMIN_COURSE_DETAIL_IP_KEY.max,
        ADMIN_COURSE_DETAIL_IP_KEY.windowSec
    );
    if (!allowed)
        return failResponse(
            { message: "Too many requests" },
            429,
            undefined,
            { "Retry-After": String(retryAfterSec) },
            true
        );
    try {
        const params = await context.params;
        const courseId = Array.isArray(params.courseId)
            ? params.courseId[0]
            : params.courseId;
        const authSession: Session | null = await auth();
        if (!authSession)
            return failResponse(
                { message: "Unauthorized", ip: ip },
                401,
                undefined,
                undefined,
                true
            );
        const user: ISessionUser | null = authSession?.user;
        if (user?.role !== USER_ROLE.INSTRUCTOR) {
            return failResponse(
                { message: "You are not authorized" },
                401,
                undefined,
                undefined,
                true
            );
        }
        if (!courseId || !validateMongooseId({ courseId })) {
            return failResponse(
                { message: "Course id is required" },
                400,
                undefined,
                undefined,
                true
            );
        }
        await connectDB(process.env.MONGODB_URI!);
        const course: ICourse | null = await Course.findByIdAndDelete(courseId);

        if (!course) {
            return failResponse(
                { message: "Course not found" },
                404,
                undefined,
                undefined,
                true
            );
        }
        logger.info("Course deleted successfully");
        return successResponse(
            { message: "Course deleted successfully" },
            200,
            undefined,
            undefined,
            true
        );
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Internal server error";
        logger.error(`Error in deleting course: ${message}`);
        return failResponse(
            { message: `Error in deleting course:${message}` },
            500,
            undefined,
            undefined,
            true
        );
    }
}
// Every moved file gets a brand-new id: replacing a video can never overwrite the old file or hit stale CDN cache
const freshTarget = (folderKey: keyof typeof TOPIC_FOLDER): string =>
    // Unique id per asset, independent of array positions
    uploadTargetPublicId(TOPIC_FOLDER[folderKey], new Types.ObjectId().toString());

// Per-lesson data gathered BEFORE any file moves
interface LessonDraft {
    // Lesson id (existing or generated)
    _id: Types.ObjectId;
    // Section it belongs to
    sectionId: Types.ObjectId;
    // Fields that came from the client (no URLs yet)
    fields: Lessonfields;
    // Pending id of a newly uploaded lecture video, if any
    videoPendingId?: string;
    // Pending id of a newly uploaded preview clip, if any
    previewPendingId?: string;
}

export async function PATCH(
    request: CustomNextRequest,
    context: { params: Promise<{ courseId: string | string[] }> }
): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(
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
    const authSession: Session | null = await auth();
    if (!authSession)
        return failResponse(
            { message: "Unauthorized", ip: ip },
            401,
            undefined,
            undefined,
            true
        );
    const sessionUser: ISessionUser | null = authSession?.user;
    if (sessionUser?.role !== USER_ROLE.INSTRUCTOR) {
        logger.warn("Unauthorized access attempt in admin course update route");
        return failResponse(
            { message: "You are not authorized" },
            401,
            undefined,
            undefined,
            true
        );
    }
    const userId: string = sessionUser.id;
    const { allowed: userAllowed, retryAfterSec: userRetryAfterSec } =
        await checkUser(
            userId,
            ADMIN_COURSE_UPDATE_USER_KEY.namespace,
            ADMIN_COURSE_UPDATE_USER_KEY.max,
            ADMIN_COURSE_UPDATE_USER_KEY.windowSec
        );
    if (!userAllowed)
        return failResponse(
            { message: "Too many requests" },
            429,
            undefined,
            { "Retry-After": String(userRetryAfterSec) },
            true
        );

    const params = await context.params;
    const courseId = Array.isArray(params.courseId)
        ? params.courseId[0]
        : params.courseId;
    if (!courseId || !validateMongooseId({ courseId: courseId })) {
        logger.warn("Course id is required in admin course update route");
        return failResponse(
            { message: "Course id is required" },
            400,
            undefined,
            undefined,
            true
        );
    }
    const parsedBody = await parseBody(request, updateCourseBodySchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const {
        sections,
        topics,
        category,
        subCategory,
        coverPublicId,
        previewVideoPublicId,
        ...courseFields
    } = body;

    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    let moved: Map<string, MovedAsset> = new Map();
    try {
        let dbSession: ClientSession = session;
        const course = (await Course.findOne({
            _id: courseId,
            instructorId: sessionUser.id,
        })
            .lean()
            .exec()) as ICourse | null;
        if (!course) {
            logger.warn(
                "Course not found in admin course update route with this Id",
                { courseId: courseId }
            );
            return failResponse(
                { message: "Course not found" },
                404,
                undefined,
                undefined,
                true
            );
        }
        const courseObjectId = course._id as Types.ObjectId;
        const pendingAssets: PendingAsset[] = [];
        // Old files to delete after a successful commit
        const staleUrls: string[] = [];

        //  Only a pending id is a new upload; an echoed existing id is ignored
        const coverPendingId = isPendingId(
            coverPublicId,
            COVER_PENDING_PREFIX
        )
            ? coverPublicId
            : undefined;
        ///Course cover is an image ( the old code treated it as a video)
        if (coverPendingId) {

            pendingAssets.push({
                publicId: coverPendingId,
                kind: "image",
                pendingPrefix: COVER_PENDING_PREFIX,
                targetPublicId: uploadTargetPublicId(
                    TOPIC_FOLDER["thumbnail"],
                    freshTarget("thumbnail")
                ),
            });
            // The old cover becomes garbage after commit
            if (course.coverImage) staleUrls.push(course.coverImage);
        }
        const previewPendingId = isPendingId(
            previewVideoPublicId,
            PREVIEW_PENDING_PREFIX
        )
            ? previewVideoPublicId
            : undefined;
        if (previewPendingId) {

            pendingAssets.push({

                publicId: previewPendingId,
                kind: "video",
                pendingPrefix: PREVIEW_PENDING_PREFIX,
                targetPublicId: uploadTargetPublicId(
                    TOPIC_FOLDER["preview-video"],
                    freshTarget("preview-video")
                ),
            });
            // The old preview video becomes garbage after commit
            if (course.previewVideo) staleUrls.push(course.previewVideo);
        }
        const sectionDocs: PlannedSection[] = [];
        const lessonDrafts: LessonDraft[] = [];
        let existingSections = [] as (ISection & { _id: Types.ObjectId })[];
        let existingLessonDocuments: ILesson[] = [];
        let existingLessons: PlannedLesson[] = [];
        let removedLessonCount = 0;

        if (sections) {
            const [sectionsDB, lessonsDB] = await Promise.all([
                Section.find({ courseId: courseObjectId }).lean().exec(),
                Lesson.find({ courseId: courseObjectId }).lean().exec(),
            ]);
            existingSections = sectionsDB;
            existingLessonDocuments = lessonsDB;
            existingLessons = lessonsDB.map((lesson) => ({
                _id: lesson._id,
                courseId: lesson.courseId,
                sectionId: lesson.sectionId,
                fields: stripUndefined({
                    name: lesson.name,
                    description: lesson.description,
                    order: lesson.order,
                    durationInSeconds: lesson.durationInSeconds,
                    videoUrl: lesson.videoUrl,
                    isPreview: lesson.isPreview,
                    previewUrl: lesson.previewUrl,
                    previewDurationInSeconds: lesson.previewDurationInSeconds,
                }),
            }));

            const lessonById = new Map(
                existingLessonDocuments.map((lesson) => [
                    lesson._id.toString(),
                    lesson,
                ])
            );
            const seenLessonIds = new Set<string>();
            sections.forEach((section, sIdx) => {
                const existingSectionId = section._id;
                if (
                    existingSectionId &&
                    !existingSections.find(
                        (s) => s._id?.toString() === existingSectionId.toString()
                    )
                ) {
                    throw new RequestError("Unknown section id", 400);
                }
                const sectionId = section._id
                    ? new Types.ObjectId(section._id)
                    : new Types.ObjectId();
                sectionDocs.push({
                    _id: sectionId,
                    courseId: courseObjectId,
                    title: section.title,
                    description: section.description,
                    order: section.order,
                });

                section.lessons.forEach((lesson, lIdx) => {
                    if (lesson._id && !lessonById.has(lesson._id.toString())) {
                        throw new RequestError("Unknown lesson Id", 400);
                    }
                    if (lesson._id && seenLessonIds.has(lesson._id)) {
                        throw new RequestError("Duplicate Lesson Id", 400);
                    }
                    if (lesson._id) seenLessonIds.add(lesson._id);

                    const lessonId = lesson._id
                        ? new Types.ObjectId(lesson._id)
                        : new Types.ObjectId();
                    const videoPendingId = isPendingId(
                        lesson.videoPublicId,
                        LECTURE_PENDING_PREFIX

                    )
                        ? lesson.videoPublicId
                        : undefined;

                    if (!lesson._id && !videoPendingId) {
                        throw new RequestError("Upload a lesson Video", 400);
                    }
                    if (videoPendingId) {
                        const lessonFinal = uploadTargetPublicId(
                            TOPIC_FOLDER["lecture-video"],
                            freshTarget("lecture-video")
                        );

                        // Main lecture video

                        pendingAssets.push({
                            publicId: videoPendingId,
                            kind: "video",
                            pendingPrefix: LECTURE_PENDING_PREFIX,
                            targetPublicId: lessonFinal,
                        });
                        if (lesson.videoUrl) staleUrls.push(lesson.videoUrl);
                    }
                    const lessonPreviewPendingId = isPendingId(
                        lesson.previewPublicId,
                        LECTURE_PREVIEW_PENDING_PREFIX
                    )
                        ? lesson.previewPublicId
                        : undefined;

                    if (lessonPreviewPendingId) {
                        const previewLessonFinal = uploadTargetPublicId(
                            TOPIC_FOLDER["lecture_preview-video"],
                            freshTarget("lecture_preview-video")
                        );
                        // Optional preview clip
                        pendingAssets.push({
                            publicId: lessonPreviewPendingId,
                            kind: "video",
                            pendingPrefix: PENDING_PREVIEW_LECTURES_SUBFOLDER,
                            targetPublicId: previewLessonFinal,
                        });
                        if (lesson.previewUrl) staleUrls.push(lesson.previewUrl);
                    }
                    lessonDrafts.push({
                        _id: lessonId,
                        sectionId,
                        videoPendingId,
                        previewPendingId: lessonPreviewPendingId,
                        // Only fields the client actually sent
                        fields: stripUndefined({
                            name: lesson.name,
                            description: lesson.description,
                            order: lesson.order,
                            durationInSeconds: lesson.durationInSeconds,
                            isPreview: lesson.isPreview,
                        }),
                    });
                });
            });

            const removedRows = existingLessonDocuments.filter(
                (lesson) => !seenLessonIds.has(lesson._id.toString())
            );
            // Remember how many for the guard below
            removedLessonCount = removedRows.length;
            // Their files become garbage after commit
            removedRows.forEach((l) => {
                // Lecture video
                if (l.videoUrl) staleUrls.push(l.videoUrl);
                // Preview clip
                if (l.previewUrl) staleUrls.push(l.previewUrl);
            });
        }
        // Never hard-delete lessons that paying students may have progress on
        // ASSUMPTION: replace with a soft delete if you add an isDeleted flag later
        if (removedLessonCount > 0) {
            const hasEnrollments = await Enrollment.exists({
                courseId: courseObjectId,
            });
            if (hasEnrollments) {
                throw new RequestError(
                    "Cannot delete lessons that have enrollments",
                    400
                );
            }
        }
        // The same pending file referenced twice would collide during the move
        if (
            new Set(pendingAssets.map((a) => a.publicId)).size !==
            pendingAssets.length
        ) {
            throw new RequestError("Each upload can only be used once", 400);
        }

        // Check every pending file exists and is the right kind (AssetError carries a
        // const sectionWithIds = body.sections.map((section) => ({
        //     ...section,
        //     _id: section._id || new mongoose.Types.ObjectId(),
        //     courseId: course._id,
        // }));
        // Ensure that the instructor can only update their own course and make this compatible with the new schema changes

        // body.sections.forEach((section, sIdx) => {
        //     section.lessons?.forEach((lesson, lIdx) => {
        //         // Unique folder per lesson so names never collide
        //         if (lesson.videoPublicId) {
        //             const lessonFinal = uploadTargetPublicId(
        //                 TOPIC_FOLDER["lecture-video"],
        //                 `c${courseId.toString()}-s${sIdx.toString()}-l${lIdx.toString()}`
        //             );
        //             const previewLessonFinal = uploadTargetPublicId(
        //                 TOPIC_FOLDER["lecture_preview-video"],
        //                 `c${courseId.toString()}-s${sIdx.toString()}-l${lIdx.toString()}`
        //             );
        //             // Main lecture video
        //             if (lesson.videoPublicId) {
        //                 pendingAssets.push({
        //                     publicId: lesson.videoPublicId,
        //                     kind: "video",
        //                     pendingPrefix: uploadFolder(
        //                         TOPIC_FOLDER["lecture-video"],
        //                         PENDING_LECTURES_SUBFOLDER
        //                     ),
        //                     targetPublicId: lessonFinal,
        //                 });
        //             }
        //             // Optional preview clip
        //             if (lesson.previewPublicId) {
        //                 pendingAssets.push({
        //                     publicId: lesson.previewPublicId,
        //                     kind: "video",
        //                     pendingPrefix: uploadFolder(
        //                         TOPIC_FOLDER["lecture_preview-video"],
        //                         PENDING_PREVIEW_LECTURES_SUBFOLDER
        //                     ),
        //                     targetPublicId: previewLessonFinal,
        //                 });
        //             }
        //         }
        //     });
        // });

        await verifyAssets(pendingAssets);

        ///Move files from pending to final
        moved = await moveAssets(pendingAssets);
        // Small helper: pending public_id -> final URL
        // Look up the moved asset for this pending id
        const urlOf = (pendingId: string): string => {
            // Get the entry from the move results
            const asset = moved.get(pendingId);
            // Fail loudly with the id, instead of a vague TypeError
            if (!asset) {
                logger.error("Asset not present in the moved state,");
                throw new Error(`No moved asset for ${pendingId}`);
            }
            // Return the final HTTPS URL
            return asset.url;
        };
        // Lessons with their final URLs, ready to write
        const lessonDocs: PlannedLesson[] = lessonDrafts.map((d) => ({
            _id: d._id,
            courseId: courseObjectId,
            sectionId: d.sectionId,
            // URLs are ONLY ever derived on the server, never taken from the client
            fields: stripUndefined({
                ...d.fields,
                videoUrl: d.videoPendingId ? urlOf(d.videoPendingId) : undefined,
                previewUrl: d.previewPendingId ? urlOf(d.previewPendingId) : undefined,
            }),
        }));
        // Final course cover URL, only when a new one was uploaded
        const coverUrl = coverPendingId ? urlOf(coverPendingId) : undefined;
        // Final course preview URL, only when a new one was uploaded
        const previewUrl = previewPendingId ? urlOf(previewPendingId) : undefined;
        const categoryId =
            category && subCategory
                ? await resolveCategory(dbSession, category.name.charAt(0).toUpperCase() + category.name.slice(1), subCategory)
                : undefined;
        await session.withTransaction(async () => {
            const topicIds = topics ? await resolveTopic(dbSession, topics) : undefined;
            let totals: { totalDurationInSeconds: number; totalLessons: number } | undefined;
            totals = await computeTotals(dbSession, courseObjectId);
            // const parentName = body.category ? body.category.name : undefined;
            // const childName = body.subCategory ? body.subCategory : undefined;

            if (sections) {
                await syncSections(
                    session,
                    courseObjectId,
                    existingSections,
                    sectionDocs
                );
                await syncLessons(session, courseObjectId, existingLessons, lessonDocs);

            }

            const coursePayload: Partial<ICourse> = stripUndefined({
                ...courseFields,
                title: body.title,
                description: body.description,
                price: body.price,
                discount: body.discount,
                faq: body.faq,
                requirements: body.requirements,
                whatYouWillLearn: body.whatYouWillLearn,
                status: body.status,
                level: body.level,
                certificate: body.certificate,
                tags: body.tags,
                topics: topicIds,
                language: body.language,
                previewvideo: previewUrl,
                coverImage: coverUrl,
                category: categoryId,
                totalDurationInSeconds: totals.totalDurationInSeconds,
                totalLessons: totals.totalLessons,
            });
            if (Object.keys(coursePayload).length) {
                await Course.updateOne(
                    { _id: courseId },

                    { $set: coursePayload },
                    { session }
                );
            }
        });

        logger.info("Course updated successfully");
        await invalidateCached(COURSES_ALL.namespace, "all");
        // const cacheId = `${page}-${limit}-${skip}-${user.id}`;
        // await invalidateCached(COURSES_INSTRUCTOR.namespace, cacheId);
        await invalidateCached(INSTRUCTOR_COURSE_WITH_ID.namespace, `${courseId}:${sessionUser.id}`)
        return successResponse(
            { message: "Course updated successfully" },
            200,
            undefined,
            undefined,
            true
        );
    } catch (error: unknown) {
        if (moved.size > 0) {
            // A failed rollback must not hide the real error
            await rollbackMoves([...moved.values()]).catch((e: unknown) =>
                logger.error("rollbackMoves failed", { error: e instanceof Error ? e.message : String(e) })
            );
        }
        // One structured log with message and stack
        logger.error("Error in updating course", {
            courseId,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        // Your own validation errors carry a safe message and the right status
        if (error instanceof RequestError)
            // Return that status, not a blanket 500
            return failResponse({ message: error.message }, error.status, undefined, undefined, true);
        // AssetError messages never contain Cloudinary internals
        if (error instanceof AssetError)
            // Same pattern
            return failResponse({ message: error.message }, error.status, undefined, undefined, true);
        // Everything else: generic message, never leak Mongo internals
        return failResponse({ message: "Error in updating course" }, 500, undefined, undefined, true);

    } finally {
        session.endSession();
    }
}

// export async function PUT(request: CustomNextRequest, context: { params: Promise<{ courseId: string | string[] }> }): Promise<NextResponse> {
//     const params = await context.params
//     const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
//     const { allowed, remaining, retryAfterSec, ip } = await checkIp(
//         request,
//         ADMIN_COURSE_UPDATE_IP_KEY.namespace,
//         ADMIN_COURSE_UPDATE_IP_KEY.max,
//         ADMIN_COURSE_UPDATE_IP_KEY.windowSec
//     );
//     if (!allowed)
//         return failResponse(
//             { message: "Too many requests" },
//             429,
//             undefined,
//             { "Retry-After": String(retryAfterSec) },
//             true
//         );

//     ///Every asset that must move out of the pending folders

//     const authSession: Session | null = await auth();
//     if (!authSession)
//         return failResponse(
//             { message: "Unauthorized", ip: ip },
//             401,
//             undefined,
//             undefined,
//             true
//         );
//     const userInSession: ISessionUser | null = authSession?.user;
//     const parsedBody = await parseBody(request, updateCourseBodySchema);
//     if (!parsedBody.ok) return parsedBody.response;
//     const body = parsedBody.data;
//     if (!userInSession || !validateMongooseId({ userId: userInSession.id })) {
//         logger.warn("Unauthorized access attempt to update course", { ip: ip });
//         return failResponse(
//             { message: "Unauthorized" },
//             401,
//             undefined,
//             undefined,
//             true
//         );
//     }
//     logger.info("This is the user is attempting to update course ", {
//         name: userInSession.name,
//         id: userInSession.id,
//     });
//     const sessionUserId: string = userInSession.id;

//     const {
//         allowed: isUserAllowed,
//         remaining: remainingAttempts,
//         retryAfterSec: retryAfter,
//     } = await checkUser(
//         userInSession.id,
//         ADMIN_COURSE_UPDATE_USER_KEY.namespace,
//         ADMIN_COURSE_UPDATE_USER_KEY.max,
//         ADMIN_COURSE_UPDATE_USER_KEY.windowSec
//     );

//     if (!isUserAllowed) {
//         return failResponse(
//             { message: "Too many requests" },
//             429,
//             undefined,
//             { "Retry-After": String(retryAfter) },
//             true
//         );
//     }

//     ///// Course preview video

//     ///// lesson Lecture Videos

//     if (!courseId || !validateMongooseId({ courseId })) {
//         logger.warn("Invalid courseId provided for update", { courseId: courseId });
//         return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
//     }
//     await connectDB(process.env.MONGODB_URI!);
//     try {
//         const existingCourse = await Course.find({ _id: courseId }).lean();
//         const sectionWithIds = body.sections.map((section, sIdx) => ({
//             ...section,
//             _id: section._id,
//             courseId: new Types.ObjectId(courseId),
//         }))
//         const lessonWithIds = body.sections.flatMap((section, sIdx) => section.lessons?.map((lesson, lIdx) => ({
//             _id: lesson._id,
//             sectionId: new Types.ObjectId(section._id),
//             courseId: new Types.ObjectId(courseId),
//             ...lesson
//         }))

//         ///Verfiy all the assets

//         const session = await mongoose.startSession();
//         try {
//             await session.withTransaction(async () => {
//                 console.log("📦 Received payload:", JSON.stringify(body, null, 2));
//                 ///Normailze names once
//                 const parentName: string = body.category.name.trim().toLowerCase();
//                 const subName: string = body.subCategory.trim().toLowerCase();
//                 console.log("🏷️ Parent category name:", parentName);
//                 console.log("🔗 Parent category slug:", toSlug(parentName));

//                 //Upsert Parent cateogry
//                 const parentCategory: ICategory = await Category.findOneAndUpdate(
//                     { name: parentName, parent: null },
//                     {
//                         $setOnInsert: { name: parentName, slug: toSlug(parentName) },
//                         parent: null,
//                     },
//                     { upsert: true, returnDocument: "after", session }
//                 );

//                 // let parentCategory = await Category.findOne({
//                 //   slug: toSlug(parentName),
//                 //   parent: null
//                 // });

//                 // if (!parentCategory) {
//                 //   parentCategory = await Category.create({  // ❌ Crashes if slug exists
//                 //     // name: parentName,
//                 //     slug: toSlug(parentName),
//                 //     parent: null,
//                 //   });
//                 // }
//                 ////Upsert the subcategory under the same parent
//                 const subCategory: ICategory = await Category.findOneAndUpdate(
//                     { name: subName, parent: parentCategory._id },
//                     {
//                         $setOnInsert: {
//                             name: subName,
//                             slug: toSlug(subName),
//                             parent: parentCategory._id,
//                         },
//                     },
//                     { upsert: true, returnDocument: "after", session }
//                 );

//                 // let subCategory = await Category.findOne({
//                 //   slug: toSlug(subName),
//                 //   parent: parentCategory._id
//                 // });

//                 // if (!subCategory) {
//                 //   subCategory = await Category.create({  // ❌ Crashes if slug exists
//                 //     // name: subName,
//                 //     slug: toSlug(subName),
//                 //     parent: parentCategory._id,
//                 //   });
//                 // }

//                 ///Duplicate Topics under normalized name
//                 const topicMap: Map<string, { name: string; description: string }> =
//                     new Map<string, { name: string; description: string }>();

//                 ///Last one wins on dupllicates
//                 body.topics.forEach((t) =>
//                     topicMap.set(t.name.trim().toLowerCase(), {
//                         name: t.name.trim(),
//                         description: t.description ?? '',
//                     })
//                 );

//                 //Upsert  in one round trip instead of find + insertmany ( which  races under concurrent requests)
//                 if (topicMap.size > 0) {
//                     await Topic.bulkWrite(
//                         [...topicMap.values()].map((t) => ({
//                             updateOne: {
//                                 filter: { name: t.name },
//                                 update: {
//                                     $setOnInsert: {
//                                         name: t.name,
//                                         description: t.description,
//                                         slug: toSlug(t.name),
//                                         isActive: true,
//                                     },
//                                 },
//                                 upsert: true,
//                             },
//                         })),
//                         { session }
//                     );
//                 }
//                 // if (topicMap.size > 0) {
//                 //   for (const topic of topicMap.values()) {
//                 //     // Check if exists
//                 //     let existingTopic = await Topic.findOne({ name: topic.name });

//                 //     if (!existingTopic) {
//                 //       const name: string = topic.name;
//                 //       const description: string = topic.description;
//                 //       const slug: toSlug(topic.name);

//                 //       // Create if not exists
//                 //       await Topic.create(topic);
//                 //     }
//                 //   }
//                 // }
//                 // Read back the ids of all topics for this course

//                 const topicDocs: ITopic[] = await Topic.find({
//                     name: { $in: [...topicMap.keys()] },
//                 })
//                     .select("_id")
//                     .session(session)
//                     .lean();

//                 ///Pre Assingn section Ids so lessons can reference them without index guessing
//                 const sectionDocs: (ISection)[] = body.sections.map((s) => ({
//                     _id: s._id ? new Types.ObjectId(s._id) : new Types.ObjectId(),
//                     courseId: new Types.ObjectId(courseId),
//                     title: s.title,
//                     description: s.description,
//                     order: s.order,

//                 }));
//                 ///Flatten lessons while keeping the each one linked to its section
//                 const lessonDocs: ILesson[] = body.sections.flatMap((s, sIndex) =>
//                     s.lessons.map((l, lIndex) => ({
//                         _id: l._id ? new Types.ObjectId(l._id) : new Types.ObjectId(),
//                         sectionId: sectionDocs[sIndex]._id,
//                         courseId,
//                         name: l.name,
//                         description: l.description,
//                         videoUrl: urlOf(l.videoPublicId),
//                         isPreview: l.isPreview,
//                         previewUrl: l.previewPublicId ? urlOf(l.previewPublicId) : undefined,
//                         durationInSeconds: l.durationInSeconds,
//                         order: l.order,
//                     }))
//                 );

//                 // Totals are computed on the server, never trusted from the client
//                 const totalDurationInSeconds: number = lessonDocs.reduce(
//                     (sum, l) => sum + l.durationInSeconds,
//                     0
//                 );

//                 // Create the course once, with totals included (no second save needed)
//                 const [course] = (await Course.create(
//                     [
//                         {
//                             _id: courseId,
//                             title: body.title,
//                             description: body.description,
//                             price: body.price,
//                             discount: body.discount,
//                             category: subCategory._id,
//                             dripType: body.dripType,
//                             faq: body.faq,
//                             requirements: body.requirements,
//                             whatYouWillLearn: body.whatYouWillLearn,
//                             previewVideo: urlOf(body.previewVideoPublicId),
//                             coverImage: urlOf(body.coverPublicId),
//                             status: body.status,
//                             totalDurationInSeconds,
//                             totalLessons: lessonDocs.length,
//                             language: body.language,
//                             level: body.level,
//                             certificate: body.certificate,
//                             tags: body.tags,
//                             // Starts at zero; enrollment jobs update it later
//                             totalEnrolledCount: 0,
//                             // Instructor comes from the session, never from the body
//                             instructorId: userInSession.id,
//                             topics: topicDocs.map((t) => t._id),
//                         },
//                     ],
//                     { session }
//                 )) as ICourse[];

//                 (await Section.insertMany(sectionDocs, { session })) as ISection[];
//                 (await Lesson.insertMany(lessonDocs, { session })) as ILesson[];

//                 ///Keep the  result for response
//                 createdCourse = course;
//             });
//         } catch (error: unknown) {
//             console.error("This is the error in admin course route", error, error instanceof Error ? error.message : "Unknown error");
//             await rollbackMoves([...moved.values()]);
//             logger.error("Error in creating course", {
//                 error: error instanceof Error ? error.message : "Unknown error",
//             });
//             const message = error instanceof Error ? error.message : "Unknown error";
//             return failResponse(
//                 { message: `Error in creating course` },
//                 500,
//                 undefined,
//                 undefined,
//                 true
//             );
//         } finally {
//             await session.endSession();
//         }

//         logger.info("Course created successfully", {
//             courseId: courseId.toString(),
//             instructorId: sessionUserId,
//         });
//         await invalidateCached(COURSES_ALL.namespace, "all");
//         return successResponse(
//             { message: "Course created successfully", course: createdCourse },
//             201,
//             undefined,
//             undefined,
//             true
//         );
//     }
