import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Course, connectDB, logger } from '@repo/shared/server';
import mongoose from "mongoose";
import { ICourse, IReview } from '@repo/shared/server';
import { CourseAggregationResult } from "@/types/aggregation/aggregation";
import { validateMongooseId } from '@repo/shared/server';


export async function GET(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    try {
        const { courseId } = context.params;
        const page = parseInt(request.nextUrl.searchParams.get("page") || "0", 10);
        if (!courseId || !validateMongooseId({ courseId: courseId })) {
            return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true);
        }
        if (!validateMongooseId({ courseId })) {
            return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true);
        }
        const result = await Course.aggregate<CourseAggregationResult>([
            { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
            // instructor info
            {
                $facet: {

                    courseData: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "instructorId",
                                foreignField: "_id",
                                as: "instructor"
                            }
                        },
                        { $unwind: "$instructor" },
                        { $project: { "instructor.password": 0, "instructor.email": 0 } }
                    ],


                    // reviews
                    reviews: [{
                        $lookup: {
                            from: "reviews",
                            let: { courseId: "$_id" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$course", "$$courseId"] } } },
                                { $sort: { createdAt: -1 } },
                                { $skip: page * 10 },
                                { $limit: 10 }
                            ],
                            as: "reviews"
                        }
                    }],

                    reviewCount: [
                        {
                            $lookup: {
                                from: "reviews",
                                let: { courseId: "$_id" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$course", "$$courseId"] } } },
                                    { $count: "totalReviews" }
                                ],
                                as: "count"
                            }
                        }
                    ],

                    ///instructor stats
                    instructorStats: [{
                        $lookup: {
                            from: "courses",
                            let: { instructorId: "$instructorId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ["$instructorId", "$$instructorId"] }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        totalCourses: { $sum: 1 },
                                        totalEnrolled: { $sum: "$totalEnrolledCount" },
                                        totalReviews: {
                                            $sum: "$reviewCount"
                                        },
                                        totalRatings: {
                                            $sum: "$ratingSum"
                                        }
                                    }
                                }
                            ],
                            as: "stats"
                        }

                    },
                    { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
                    { $replaceRoot: { newRoot: "$stats" } }
                    ]
                }
            }
        ]);
        const data = result[0];
        const course: ICourse = data?.courseData[0]
        const reviews: IReview[] = data?.reviews || []
        const instructorStats = data?.instructorStats?.[0];

        const totalEnrolled: number = instructorStats?.totalEnrolled || 0
        const totalReviews: number = instructorStats?.totalReviews || 0
        const totalRatings: number = instructorStats?.totalRatings || 0
        logger.info("Course fetched successfully", { courseId });
        return successResponse({ course, reviews, totalEnrolled, totalReviews, totalRatings }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Fetching Course", { error: message });
        return failResponse({ message: `Error in Fetching Course: ${message}` }, 500, undefined, undefined, true);
    }
}