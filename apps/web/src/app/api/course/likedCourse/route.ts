import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { userCourse } from '@repo/shared/server';
import mongoose from "mongoose";
import { logger } from '@repo/shared/server';
import { validateMongooseId } from '@repo/shared/server';
import { auth } from "@/auth";
import { Session } from "next-auth";

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    await connectDB(process.env.MONGODB_URI!);
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({ message: "unauthorized" }, 401, undefined, undefined, true);
        }
        if (!validateMongooseId({ userId: user.id })) return failResponse({ message: "Invalid user id" }, 400, undefined, undefined, true);
        const userId: string | null = user?.id
        if (mongoose.Types.ObjectId.isValid(userId)) {
            return failResponse({
                message: "Invalid user id"
            }, 400, undefined, undefined, true)
        }
        const result = await userCourse.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    isLiked: true
                }
            },
            {
                $lookup: {
                    from: "courses",
                    let: { courseId: "$courseId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$courseId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",//instructors collection
                                let: { instructorId: "$instructorId" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$instructorId"]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            name: 1,
                                            _id: 1,
                                            profileImage: 1
                                        }
                                    }
                                ],
                                as: "instructor"
                            }
                        },
                        {
                            $unwind: {
                                path: "$instructor",
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ],
                    as: "course"
                }
            },
            {
                $unwind: {
                    path: "$course",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    courseId: "$course._id",
                    coverImage: "$course.coverImage",
                    title: "$course.title",
                    description: "$course.description",
                    price: "$course.price",
                    discount: "$course.discount",
                    instructor: "$course.instructor.name",
                    instructorId: "$course.instructor._id",
                    instructorImage: "$course.instructor.profileImage",
                    createdAt: "$course.createdAt",
                    updatedAt: "$course.updatedAt",
                }
            }
        ])

        if (result.length === 0) {
            return successResponse({ message: "No liked courses found" }, 200, undefined, undefined, true);
        }
        logger.info("Liked courses fetched successfully", { userId, likedCourseCount: result.length });
        return successResponse({ message: "Liked courses fetched successfully", userLikedCourses: result }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting liked courses", { error: message });
        return failResponse({ message: `Error Fetching courses :${message}` }, 500, undefined, undefined, true);

    }
};