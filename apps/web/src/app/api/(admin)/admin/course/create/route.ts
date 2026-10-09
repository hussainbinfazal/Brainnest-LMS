import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Topic, Section, Lesson, connectDB, Course, Category, IFaq, CreateSectionType, checkUser, ADMIN_COURSE_CREATE_USER_KEY } from '@repo/shared/server';
import { CourseDocument, ICategory, ICourse, ILesson, ISection, ITopic } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@repo/shared/server";
import mongoose, { ObjectId, Types } from "mongoose";
import { validateMongooseId } from "@/utils/fieldsValidation/idValidator/idValidator";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
import { ADMIN_COURSE_CREATE_IP_KEY, checkIp } from "@repo/shared/server";
import { uploadFolder } from "@/utils/upload/uploadSubFolderCreation";
import { PENDING_LECTURES_SUBFOLDER, PENDING_PREVIEW_VIDEO_SUBFOLDER, PENDING_THUMBNAIL_SUBFOLDER } from "@repo/shared";
import cloudinary from "@repo/shared/config/cloudinary/cloudinary";
import { createCourseSchema } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { AssetError, moveAssets, MovedAsset, PendingAsset, rollbackMoves, verifyAssets } from "@/utils/CloudinaryAssets";




///TODO 
//1) Implement pending video, lesson and coverImage functionality;
//2) 


///Slug Helper
function toSlug(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");////turns web development to web-development
}

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_CREATE_IP_KEY.namespace, ADMIN_COURSE_CREATE_IP_KEY.max, ADMIN_COURSE_CREATE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    let createdCourse: unknown;

    const parsedBody = await parseBody(request, createCourseSchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;

    const courseId = new Types.ObjectId();

    const finalFolder = uploadFolder(`courses/${courseId.toString()}`);

    ///Every asset that must move out of the pending folders




    const authSession: Session | null = await auth()
    if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
    const userInSession: ISessionUser | null = authSession?.user;
    if (!userInSession || !validateMongooseId({ userId: userInSession.id })) {
        logger.warn("Unauthorized access attempt to create course", { ip: ip });
        return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
    }
    logger.info("This is the user is attempting to create course ", { name: userInSession.name, id: userInSession.id });
    const sessionUserId: string = userInSession.id;

    const { allowed: isUserAllowed, remaining: remainingAttempts, retryAfterSec: retryAfter } = await checkUser(userInSession.id, ADMIN_COURSE_CREATE_USER_KEY.namespace, ADMIN_COURSE_CREATE_USER_KEY.max, ADMIN_COURSE_CREATE_USER_KEY.windowSec);

    if (!isUserAllowed) {
        return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfter) }, true);
    }
    const pendingAssets: PendingAsset[] = [
        ///Course cover is an image ( the old code treated it as a video)
        {
            publicId: body.coverPublicId, kind: 'image', pendingPrefix: PENDING_THUMBNAIL_SUBFOLDER, targetPublicId: `${finalFolder}/cover`
        },
        ///// Course preview video
        {
            publicId: body.coverPublicId, kind: 'image', pendingPrefix: PENDING_THUMBNAIL_SUBFOLDER, targetPublicId: `${finalFolder}/cover`
        },
        ///// lesson Lecture Videos
    ]
    body.sections.forEach((section, sIdx) => {
        section.lessons.forEach((lesson, lIdx) => {
            // Unique folder per lesson so names never collide
            const base = `${finalFolder}/s${sIdx}-l${lIdx}`;
            // Main lecture video
            pendingAssets.push({ publicId: lesson.videoPublicId, kind: "video", pendingPrefix: uploadFolder(PENDING_LECTURES_SUBFOLDER), targetPublicId: `${base}/video` });
            // Optional preview clip
            if (lesson.previewPublicId) {
                pendingAssets.push({ publicId: lesson.previewPublicId, kind: "video", pendingPrefix: uploadFolder(PENDING_LECTURES_SUBFOLDER), targetPublicId: `${base}/preview` });
            }
        });
    });



    ///Verfiy all the assets
    try {
        await verifyAssets(pendingAssets);
    } catch (err: unknown) {
        const status = err instanceof AssetError ? err.status : 500;
        // Safe to show: AssetError messages never contain Cloudinary internals
        const message = err instanceof AssetError ? err.message : "Asset verification failed";
        return failResponse({ message }, status, undefined, undefined, true)
    }

    await connectDB(process.env.MONGODB_URI!);

    ///Move files from pending to final
    let moved: Map<string, MovedAsset>;
    try {
        moved = await moveAssets(pendingAssets); ///Move all the pending assets
    } catch (err: unknown) {
        // Same mapping as above
        const status = err instanceof AssetError ? err.status : 500;
        return failResponse({ message: "Failed to process uploaded files" }, status, undefined, undefined, true);
    }
    // Small helper: pending public_id -> final URL
    const urlOf = (pendingId: string): string => moved.get(pendingId)!.url;
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            ///Normailze names once
            const parentName: string = body.category.name.trim().toLowerCase();
            const subName: string = body.subCategory.trim().toLowerCase();


            //Upsert Parent cateogry
            const parentCategory: ICategory = await Category.findOneAndUpdate(
                { name: parentName, parent: null },
                { $setOnInsert: { name: parentName, slug: toSlug(parentName) }, parent: null },
                { upsert: true, new: true, session }
            );
            ////Upsert the subcategory under the same parent
            const subCategory: ICategory = await Category.findOneAndUpdate(
                { name: subName, parent: parentCategory._id },
                {
                    $setOnInsert: {
                        name: subName, slug: toSlug(subName), parent: parentCategory._id
                    }
                },
                { upsert: true, new: true, session }
            );



            ///Duplicate Topics under normalized name
            const topicMap: Map<string, { name: string, description: string }> = new Map<string, { name: string, description: string }>();

            ///Last one wins on dupllicates
            body.topics.forEach((t) =>
                topicMap.set(t.name.trim().toLowerCase(), { name: t.name.trim(), description: t.description })
            );


            //Upsert  in one round trip instead of find + insertmany ( which  races under concurrent requests)
            if (topicMap.size > 0) {
                await Topic.bulkWrite(
                    [...topicMap.values()].map((t) => ({
                        updateOne: {
                            filter: { name: t.name },
                            update: { $setOnInsert: { name: t.name, description: t.description, slug: toSlug(t.name), isActive: true } },
                            upsert: true
                        }
                    })),
                    { session }
                )
            };
            // Read back the ids of all topics for this course

            const topicDocs: ITopic[] = await Topic.find(
                { name: { $in: [...topicMap.keys()] } },
            ).select('_id').session(session).lean()


            ///Pre Assingn section Ids so lessons can reference them without index guessing
            const sectionDocs: ISection[] = body.sections.map((s) => ({
                _id: new Types.ObjectId(),
                courseId,
                title: s.title,
                description: s.description,
                order: s.order
            }));
            ///Flatten lessons while keeping the each one linked to its section
            const lessonDocs: ILesson[] = body.sections.flatMap((s, sIndex) => s.lessons.map((l, lIndex) => ({
                _id: new Types.ObjectId(),
                sectionId: sectionDocs[sIndex]._id,
                courseId,
                name: l.name,
                description: l.description,
                videoUrl: urlOf(l.videoPublicId),
                isPreview: l.isPreview,
                previewUrl: l.previewPublicId ? urlOf(l.previewPublicId) : undefined,
                durationInSeconds: l.durationInSeconds,
                idPreview: l.isPreview,
                order: l.order,
            })))

            // Totals are computed on the server, never trusted from the client
            const totalDurationInSeconds: number = lessonDocs.reduce((sum, l) => sum + l.durationInSeconds, 0);

            // Create the course once, with totals included (no second save needed)
            const [course] = await Course.create([{
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
            }], { session }) as ICourse[]

            await Section.insertMany(sectionDocs, { session }) as ISection[]
            await Lesson.insertMany(lessonDocs, { session }) as ILesson[]

            ///Keep the  result for response
            createdCourse = course

        })


    } catch (error: unknown) {
        await rollbackMoves([...moved.values()])
        logger.error("Error in creating course", { error: error instanceof Error ? error.message : 'Unknown error' });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ message: `Error in creating course: ${message}` }, 500, undefined, undefined, true);
    } finally {
        await session.endSession();
    }

    logger.info("Course created successfully", { courseId: courseId.toString(), instructorId: sessionUserId });
    return successResponse({ message: "Course created successfully", course: createdCourse }, 201, undefined, undefined, true);

}

