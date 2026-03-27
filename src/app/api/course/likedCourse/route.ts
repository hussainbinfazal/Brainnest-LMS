import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/mongoDB/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import UserCourse from "@/models/User/userCourse";
import mongoose from "mongoose";
import { logger } from "@/utils/logger/logger";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";

export async function GET(request: CustomNextRequest): Promise<NextResponse> {
    await connectDB();
    try {
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        if (!validateMongooseId({ userId: user.id })) return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
        const userId: string | null = user?.id
        if (mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({
                message: "Invalid user id"
            }, {
                status: 400
            })
        }
        const result = await UserCourse.aggregate([
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
            return NextResponse.json({ message: "No liked courses found" }, { status: 200 });
        }

        return NextResponse.json({ message: "Liked courses fetched successfully", userLikedCourses: result }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in getting liked courses", { error: message });
        return NextResponse.json({ message: `Error Fetching courses :${message}` }, { status: 500 });

    }
};