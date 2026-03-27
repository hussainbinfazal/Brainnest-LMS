import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger/logger";
import mongoose from "mongoose";
import Review from "@/models/Course/reviewModel";
import { connectDB } from "@/config/mongoDB/db";
import Course from "@/models/Course/courseModel";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "@/types/server";

export async function GET(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    try {
        const { courseId } = context.params;
        const { searchParams } = new URL(request.url);
        if (!courseId) {
            logger.warn("Course Id is required");
            return NextResponse.json({ message: "Course Id is required" }, { status: 400 });
        }
        if (!validateMongooseId({ courseId })) {
            logger.error("Invalid course id");
            return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
        }

        const sortOptions: Record<string, any> = {
            latest: { createdAt: -1 },
            oldest: {
                createdAt: 1
            },
            highest: {
                rating: -1
            },
            lowest: {
                rating: 1
            }
        }

        const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
        const page = Number(searchParams.get('page')) || 1;
        const skip = (page - 1) * limit;
        const sortType = searchParams.get('sort') || 'latest';
        const [reviews, totalCount] = await Promise.all([
            Review.aggregate([
                { $match: { course: new mongoose.Types.ObjectId(courseId) } },
                { $sort: sortOptions[sortType] || { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    profileImage: 1
                                }
                            }
                        ],
                        as: "user"
                    },
                },
                { $unwind: "$user" },
                {
                    $project: {
                        rating: 1,
                        comment: 1,
                        createdAt: 1,
                        user: 1
                    }
                }
            ]),
            Review.countDocuments({ course: new mongoose.Types.ObjectId(courseId) })
        ])
        logger.info("Reviews fetched successfully", { courseId, page, limit, totalCount, sortType });
        return NextResponse.json({
            message: "Reviews fetched successfully", reviews: reviews, pagination: { /////////////add pagination in the routes 
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching reviews:", { error: message });
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


export async function DELETE(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { courseId } = context.params;
        const { searchParams } = new URL(request.url);
        if (!courseId) {
            logger.warn("Course Id is required");
            return NextResponse.json({ message: "Course Id is required" }, { status: 400 });
        }
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.error("Unauthorized access", { ip: request.ip });
            session.endSession();
            return NextResponse.json({
                message: "Unauthorized",
            }, { status: 401 });
        }
        const reviewId = searchParams.get('reviewId');
        if (!reviewId) {
            logger.warn("Review Id is required");
            return NextResponse.json({ message: "Review Id is required" }, { status: 400 });
        }

        const deletedReview = await Review.findByIdAndDelete(reviewId).select("rating").session(session);
        if (!deletedReview) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Review not found" }, { status: 404 });
        }
        if (!validateMongooseId({ courseId, reviewId })) {
            logger.error("Invalid course id or review id", { courseId, reviewId });
            return NextResponse.json({ message: "Invalid course id or review id" }, { status: 400 });
        }
        const rating = deletedReview.rating;
        await Course.updateOne(
            { _id: courseId },
            {
                $inc: {
                    totalReviews: -1,
                    totalRatingSum: -rating,
                    [`ratingDistribution.${rating - 1}`]: -1,
                },
            },
            { session }
        );
        await session.commitTransaction();
        logger.info("Review deleted successfully", { reviewId });
        return NextResponse.json({ message: "Review deleted successfully" }, { status: 200 });
    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error deleting review:", { error: message });
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        session.endSession();

    }
}
