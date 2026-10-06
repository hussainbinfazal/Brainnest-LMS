import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Topic, Section, Lesson, connectDB, Course, Category } from '@repo/shared/server';
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

const createCourseBodySchema = z.record(z.string(), z.any());

interface CreateCourseBody {
    title: string;
    price: number;
    description: string;
    coverImage: string;
    subCategory: string
    category: ICategory;
    discount: number;
    duration: number;
    whatYouWillLearn: string[];
    dripType: string
    requirements: string[];
    level: string;
    language: string;
    status: string;
    tags: string[]
    isPreview: boolean;
    previewVideo: string
    lessons: ILesson[];
    topics: string[]
    sections: ISection[];
    faq: string[]

}
///TODO 
//1) Implement pending video, lesson and coverImage functionality;
//2) 

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, ADMIN_COURSE_CREATE_IP_KEY.namespace, ADMIN_COURSE_CREATE_IP_KEY.max, ADMIN_COURSE_CREATE_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    session.startTransaction()
    try {
        const parsedBody = await parseBody(request, createCourseBodySchema);
        if (!parsedBody.ok) return parsedBody.response;
        const body = parsedBody.data;
        const { title, description, price, category, subCategory, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount, topics, previewVideo, dripType, sections,

        } = body;
        if (!title || !price || !sections?.length || description === "" || category === "" || subCategory === "" || faq === "" || requirements === "" || whatYouWillLearn === "" || video === "" || lessons === "" || coverImage === "" || status === "" || duration === 0 || language === "" || level === "" || tags === "" || discount === "") {
            logger.warn("Validation failed: Missing required fields", { title, description, price, category, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount, subCategory });
            return failResponse({ message: "All fields are required", title, description, price, category, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount, subCategory }, 400, undefined, undefined, true);
        }
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const userInSession: ISessionUser | null = authSession?.user;
        if (!userInSession || !validateMongooseId({ userId: userInSession.id })) {
            logger.warn("Unauthorized access attempt to create course", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
        }
        logger.info("This is the user is attempting to create course ", { name: userInSession.name, id: userInSession.id });
        const sessionUserId: string = userInSession.id;

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
            isPreviewVideo: lesson.isPreviewUrl,
            order: lesson.order
        }));
        await Lesson.insertMany(lessonDocs, { session });
        const totalLessons: number = lessonDocs.length
        createdCourse.totalLessons = totalLessons;
        await createdCourse.save({ session });

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