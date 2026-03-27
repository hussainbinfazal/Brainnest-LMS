import { NextRequest, NextResponse } from "next/server";
import Course from "@/models/Course/courseModel";
import { connectDB } from "@/config/mongoDB/db";
import { logger } from "@/utils/logger/logger";
import mongoose from "mongoose";
import { ICourse, IReview } from "@/types/model";
import { CourseAggregationResult } from "@/types/aggregation/aggregation";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";


export async function GET(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const { courseId } = context.params;
        const page = parseInt(request.nextUrl.searchParams.get("page") || "0", 10);
        if (!courseId || !validateMongooseId({ courseId: courseId })) {
            return NextResponse.json({ message: "Course id is required" }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
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
        return NextResponse.json({ course, reviews, totalEnrolled, totalReviews, totalRatings }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error in Fetching Course", { error: message });
        return NextResponse.json({ message: `Error in Fetching Course: ${message}` }, { status: 500 });
    }
}