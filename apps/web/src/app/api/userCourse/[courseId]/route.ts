import { CUserCourse } from "@/types/client";
import { CustomNextRequest } from "@/types/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { serializeUserCourse } from "@/utils/serializer/userCourse.Serializer";
import { connectDB, ISessionUser, IUserCourse, logger, userCourse, validateMongooseId } from "@repo/shared";
import { CACHE_TTL, getCached, setCached } from "@repo/shared/config/redisConfig/cache-helper";
import { NextResponse } from "next/server";

export async function GET(request:
    CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const user: ISessionUser | null = await getDataFromToken(request);
    if (!user) {
        logger.info("Unauthorized access", { ip: request.ip });
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId: string = user.id;
    const { courseId } = await context.params;
    if (!validateMongooseId({ userId: userId })) {
        logger.warn("Invalid user id", { userId });
        throw new Error("Invalid user Id");
    }
    await connectDB(process.env.MONGODB_URI!);
    try {
        if (!validateMongooseId({ courseId: courseId })) {
            logger.warn("Invalid course id", { courseId });
            throw new Error("Invalid course Id");
        }
        if (!validateMongooseId({ userId: userId })) {
            logger.warn("Invalid user id", { userId });
            throw new Error("Invalid user Id");
        }
        const cached = await getCached<CUserCourse>(`userCourses`, `${userId}-${courseId}`);
        if (cached) {
            logger.info("User Courses fetched from cache");
            return NextResponse.json({ userCourse: cached });
        }
        const authUserCourse: IUserCourse | null = await userCourse.findOne({ userId: userId, courseId: courseId }).lean().exec();
        if (!authUserCourse) {
            logger.info("User Courses not found");
            return NextResponse.json({ message: "User Course not found" }, { status: 404 });
        }
        const serialized = serializeUserCourse(authUserCourse);
        await setCached<CUserCourse>(`userCourses`, `${userId}-${courseId}`, serialized, CACHE_TTL.MEDIUM);
        logger.info("User Courses fetched successfully");
        console.log("LIKE DEBUG:", {
            userId,
            courseId,
            userCourseId: authUserCourse?._id,
            isLiked: authUserCourse?.isLiked,
            likedAt: authUserCourse?.likedAt,
        });
        return NextResponse.json({ message: "User Courses fetched successfully", userCourse: serialized }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        logger.error("Error fetching User Courses", { message, error });
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }

}