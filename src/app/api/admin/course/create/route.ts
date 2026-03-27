import { NextRequest, NextResponse } from "next/server";
import Course from "@/models/Course/courseModel";
import { connectDB } from "@/config/mongoDB/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { v4 as uuidv4 } from 'uuid';
import { ICategory, ICourse, ILesson, ISection, ITopic } from "@/types/model";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { logger } from "@/utils/logger/logger";
import Category from "@/models/Course/categoryModel";
import Topic from "@/models/Course/topicModel";
import Section from "@/models/Course/sectionModel";
import Lesson from "@/models/Course/lessonModel";
import mongoose, { ObjectId, Types } from "mongoose";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";

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

export async function POST(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction()
    try {
        const body = await request.json();
        const { title, description, price, category, subCategory, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount, topics, previewVideo, dripType, sections,

        } = body;
        if (!title || !price || !sections?.length || description === "" || category === "" || subCategory === "" || faq === "" || requirements === "" || whatYouWillLearn === "" || video === "" || lessons === "" || coverImage === "" || status === "" || duration === 0 || language === "" || level === "" || tags === "" || discount === "") {
            logger.warn("Validation failed: Missing required fields", { title, description, price, category, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount, subCategory });
            return NextResponse.json({ message: "All fields are required", title, description, price, category, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount, subCategory }, { status: 400 });
        }
        const userInSession: ISessionUser | null = await getDataFromToken(request);
        if (!userInSession || !validateMongooseId({ userId: userInSession.id })) {
            logger.warn("Unauthorized access attempt to create course", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

        const topicNames = topics.map((t: ITopic) => t.name.trim().toLowerCase())
        let existingTopics = await Topic.find({ name: { $in: topicNames } });
        const existingTopicNames = new Map(existingTopics.map((t: ITopic) => [t.name, t]));
        const newTopics = topics.filter((t: ITopic) => !existingTopicNames.has(t.name.trim().toLowerCase()))
            .map((t: ITopic) => ({ name: t.name.trim().toLowerCase(), description: t.description, slug: t.name.trim().toLowerCase().replace(/\s+/g, '-'), isActive: true }));


        const createdTopics = await Topic.insertMany(newTopics, { session });
        const allTopics = [...existingTopics, ...createdTopics];
        topicIds = allTopics.map(t => t._id as Types.ObjectId);


        let createdCourse: ICourse = await new Course({
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


        const sectionDocs = sections.map((section: ISection) => ({
            courseId: createdCourse._id,
            title: section.title,
            description: section.description,
            order: section.order
        }));
        const createdSections = await Section.insertMany(sectionDocs, { session });
        const lessonDocs = lessons.map((lesson: ILesson, index: number) => ({
            courseId: createdCourse._id,
            name: lesson.name,
            videoUrl: lesson.videoUrl,
            sectionId: createdSections[index]?._id,
            description: lesson.description,
            durationInSeconds: Number(lesson.durationInSeconds) || 0,
            isPreview: lesson.isPreview,
            isPreviewVideo: lesson.isPreviewVideo,
            order: lesson.order
        }));
        await Lesson.insertMany(lessonDocs, { session });
        const totalLessons = lessonDocs.length
        createdCourse.totalLessons = totalLessons;
        await createdCourse.save({ session });

        await session.commitTransaction();
        session.endSession();
        logger.info("Course created successfully", { courseId: createdCourse._id, instructorId: sessionUserId });

        return NextResponse.json({ message: "Course created successfully", course: createdCourse }, { status: 201 });

    } catch (error: any) {
        await session.abortTransaction()
        session.endSession()
        logger.error("Error in creating course", { error: error instanceof Error ? error.message : 'Unknown error' });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: `Error in creating course: ${message}` }, { status: 500 });
    }

}