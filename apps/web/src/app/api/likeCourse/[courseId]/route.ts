import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { connectDB, logger } from "@repo/shared";
import {Course, User, userCourse,IUser, validateMongooseId} from "@repo/shared";
import { CustomNextRequest, ISessionUser } from "@/types/server";



export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);

    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        const { courseId } = context.params;

        if (!user) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const userId: string = user.id;

        if (!userId || !validateMongooseId({ userId })) {
            logger.info("Invalid user id");
            return NextResponse.json({ message: "Invalid user id" }, { status: 400 })
        }

        if (!courseId || !validateMongooseId({ courseId })) {
            logger.info("Invalid course id");
            return NextResponse.json({ message: "Invalid course id" }, { status: 400 })
        }
        const [userDB, courseDB, userCourseDB] = await Promise.all([
            User.exists({ _id: userId }),
            Course.exists({ _id: courseId }).select("title").lean(),
            userCourse.findOne({ userId: userId, courseId: courseId })
        ])
        if (!userDB) {
            logger.info("User not found");
            return NextResponse.json({ message: "User not found" }, { status: 403 });
        }
        if (!courseDB) {
            logger.info("Course not found");
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        // Check if already liked using UserCourse model

        if (userCourseDB && userCourseDB.isLiked) {
            logger.info("User already liked this course", { courseName: courseDB.title });
            return NextResponse.json({ message: "User already liked this course", courseName: courseDB.title }, { status: 400 });
        }

        // Create or update UserCourse record
        await userCourse.findOneAndUpdate(
            {
                userId: userId,
                courseId: courseId
            },
            {
                isLiked: true,
                likedAt: new Date()
            },
            { upsert: true, new: true },

        );
        logger.info("Course liked successfully", { courseName: courseDB.title });
        return NextResponse.json({ message: "Course liked successfully", courseName: courseDB.title }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error liking course:", { error: message });
        return NextResponse.json({ message: `Error liking course` }, { status: 500 });
    }
}

