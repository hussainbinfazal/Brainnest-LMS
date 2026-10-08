import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Topic, Section, Lesson, connectDB, Course, Category, IFaq } from '@repo/shared/server';
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
import { AssetError, moveAssets, MovedAsset, PendingAsset } from "@/utils/CloudinaryAssets";




///TODO 
//1) Implement pending video, lesson and coverImage functionality;
//2) 

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_CREATE_IP_KEY.namespace, ADMIN_COURSE_CREATE_IP_KEY.max, ADMIN_COURSE_CREATE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    const session = await mongoose.startSession();
    session.startTransaction()
    try {
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
            moved = await moveAssets(pendingAssets);
        } catch (err: unknown) {
            // Same mapping as above
            const status = err instanceof AssetError ? err.status : 500;
            return failResponse({ message: "Failed to process uploaded files" }, status, undefined, undefined, true);
        }
        // Small helper: pending public_id -> final URL
        const urlOf = (pendingId: string): string => moved.get(pendingId)!.url;

        const session = await mongoose.startSession();
        session.startTransaction()
        const parentCategoryName: string = category.name.trim().toLowerCase();
        const subCategoryName: string = subCategory.trim().toLowerCase();

        let parentCategory = await Category.findOneAndUpdate(
            { name: parentCategoryName, parent: null },
            { $setOnInsert: { name: parentCategoryName, slug: parentCategoryName.replace(/\s+/g, '-'), parent: null } },
            { upsert: true, new: true, session }
        );


        let newSubCategory: ICategory | null = await Category.findOneAndUpdate({ name: subCategoryName, parent: parentCategory._id }, { $setOnInsert: { name: subCategoryName, slug: subCategoryName.replace(/\s+/g, '-'), parent: parentCategory._id } }, { upsert: true, new: true, session })


        // normalizes topic and lesson data

        let topicIds: Types.ObjectId[] = [];

        const topicNames: string[] = topics.map((t: ITopic) => t.name.trim().toLowerCase())
        let existingTopics = await Topic.find({ name: { $in: topicNames } });
        const existingTopicNames: Map<string, ITopic> = new Map(existingTopics.map((t: ITopic) => [t.name, t]));
        const newTopics: ITopic[] = topics.filter((t: ITopic) => !existingTopicNames.has(t.name.trim().toLowerCase()))
            .map((t: ITopic) => ({ name: t.name.trim().toLowerCase(), description: t.description, slug: t.name.trim().toLowerCase().replace(/\s+/g, '-'), isActive: true }));


        const createdTopics: ITopic[] = await Topic.insertMany(newTopics, { session });
        const allTopics: ITopic[] = [...existingTopics, ...createdTopics];
        topicIds = allTopics.map(t => t._id as Types.ObjectId);


        let createdCourse: CourseDocument = await new Course({
            title,
            description,
            price,
            category: newSubCategory?._id,
            dripType,
            faq,
            requirements,
            whatYouWillLearn,
            previewVideo,
            coverImage,
            status: status.toLowerCase() === 'published' ? 'published' : 'draft',
            discount,
            totalDurationInSeconds: Number(duration) || 0,
            language,
            level,
            certificate,
            tags,
            totalEnrolledCount: 0, /// update this when students enroll in the background job and also update the course document with the total enrolled count for better performance and scalability
            instructorId: sessionUserId,
            topics: topicIds
        },).save({ session });


        const sectionDocs: ISection[] = sections.map((section: ISection) => ({
            courseId: createdCourse._id,
            title: section.title,
            description: section.description,
            order: section.order
        }));
        const createdSections: ISection[] = await Section.insertMany(sectionDocs, { session });
        const lessonDocs: ILesson[] = lessons.map((lesson: ILesson, index: number) => ({
            courseId: createdCourse._id,
            name: lesson.name,
            videoUrl: lesson.videoUrl,
            sectionId: createdSections[index]?._id,
            description: lesson.description,
            durationInSeconds: Number(lesson.durationInSeconds) || 0,
            isPreview: lesson.isPreview,
            previewUrl: lesson.previewUrl,
            order: lesson.order
        }));
        const createdLessons: ILesson[] = await Lesson.insertMany(lessonDocs, { session });
        const totalLessons: number = lessonDocs.length
        createdCourse.totalLessons = totalLessons;
        await createdCourse.save({ session });
        for (const section of sections) {
            for (const lesson of section) {
                if (lesson.previewPublicId) {
                    try {
                        const previewVideoMoved = await cloudinary.uploader.rename(lesson.previewPublicId, `${lesson.previewPublicId}/${createdCourse._id}`, { resource_type: 'video' });
                        await cloudinary.uploader.remove_tag(PREVIEW_VIDEO_PENDING_PREFIX, [previewVideoMoved.public_id]);
                        lesson.previewUrl = previewVideoMoved.secure_url;
                    } catch (moveError: unknown) {
                        logger.error("Error in moving preview video", { error: moveError instanceof Error ? moveError.message : 'Unknown error' });
                        const message = moveError instanceof Error ? moveError.message : 'Unknown error';
                        return failResponse({ message: `Error in moving preview video: ${message}` }, 500, undefined, undefined, true);
                    }
                }
                if (lesson.videoPublicId) {
                    try {
                        const previewVideoMoved = await cloudinary.uploader.rename(lesson.previewPublicId, `${lesson.previewPublicId}/${createdCourse._id}`, { resource_type: 'video' });
                        await cloudinary.uploader.remove_tag(PREVIEW_VIDEO_PENDING_PREFIX, [previewVideoMoved.public_id]);
                        lesson.previewUrl = previewVideoMoved.secure_url;
                    } catch (moveError: unknown) {
                        logger.error("Error in moving preview video", { error: moveError instanceof Error ? moveError.message : 'Unknown error' });
                        const message = moveError instanceof Error ? moveError.message : 'Unknown error';
                        return failResponse({ message: `Error in moving preview video: ${message}` }, 500, undefined, undefined, true);
                    }
                }
            }
        }
        if (previewPublicId) {
            try {
                const previewVideoMoved = await cloudinary.uploader.rename(previewPublicId, `${previewPublicId}/${createdCourse._id}`, { resource_type: 'video' });
                await cloudinary.uploader.remove_tag(PREVIEW_VIDEO_PENDING_PREFIX, [previewVideoMoved.public_id]);
                createdCourse.previewVideo = previewVideoMoved.secure_url;
                await createdCourse.save({ session });
            } catch (moveError: unknown) {
                logger.error("Error in moving preview video", { error: moveError instanceof Error ? moveError.message : 'Unknown error' });
                const message = moveError instanceof Error ? moveError.message : 'Unknown error';
                return failResponse({ message: `Error in moving preview video: ${message}` }, 500, undefined, undefined, true);
            }
        }
        if (thumbnailId) {
            try {
                const previewThumbnailMoved = await cloudinary.uploader.rename(thumbnailId, `${thumbnailId}/${createdCourse._id}`, { resource_type: 'video' });
                await cloudinary.uploader.remove_tag(PREVIEW_THUMBNAIL_PENDING_PREFIX, [previewThumbnailMoved.public_id]);
                createdCourse.coverImage = previewThumbnailMoved.secure_url;
                await createdCourse.save({ session });
            } catch (moveError: unknown) {
                logger.error("Error in moving preview video", { error: moveError instanceof Error ? moveError.message : 'Unknown error' });
                const message = moveError instanceof Error ? moveError.message : 'Unknown error';
                return failResponse({ message: `Error in moving preview video: ${message}` }, 500, undefined, undefined, true);
            }
        }
        await session.commitTransaction();
        session.endSession();
        logger.info("Course created successfully", { courseId: createdCourse._id, instructorId: sessionUserId });

        return successResponse({ message: "Course created successfully", course: createdCourse }, 201, undefined, undefined, true);

    } catch (error: unknown) {
        await session.abortTransaction()
        logger.error("Error in creating course", { error: error instanceof Error ? error.message : 'Unknown error' });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return failResponse({ message: `Error in creating course: ${message}` }, 500, undefined, undefined, true);
    } finally {
        await session.endSession();
    }

}

function verifyAssets(pendingAssets: any) {
    throw new Error("Function not implemented.");
}
