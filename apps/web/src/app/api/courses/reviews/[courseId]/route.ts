import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger/logger.node";
import mongoose from "mongoose";
import { Review } from '@repo/shared/server';
import { connectDB, Course } from '@repo/shared/server';
import { validateMongooseId } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { Session } from "next-auth";
import { auth } from "@/auth";

export async function GET(request: NextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    await connectDB(process.env.MONGDB_URI!);
    try {
        const { courseId } = context.params;
        const { searchParams } = new URL(request.url);
        if (!courseId) {
            logger.warn("Course Id is required");
            return failResponse({ message: "Course Id is required" }, 400, undefined, undefined, true);
        }
        if (!validateMongooseId({ courseId })) {
            logger.error("Invalid course id");
            return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true);
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
        return successResponse({
            message: "Reviews fetched successfully", reviews: reviews, pagination: { /////////////add pagination in the routes 
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error fetching reviews:", { error: message });
        return failResponse({ message: message }, 500, undefined, undefined, true);
    }
}


export async function DELETE(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
    await connectDB(process.env.MONGODB_URI);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { courseId } = context.params;
        const { searchParams } = new URL(request.url);
        if (!courseId) {
            logger.warn("Course Id is required");
            return failResponse({ message: "Course Id is required" }, 400, undefined, undefined, true);
        };
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;

        if (!user || !user.id) {
            logger.error("Unauthorized access", { ip: ip });
            session.endSession();
            return failResponse({
                message: "Unauthorized",
            }, 401, undefined, undefined, true);
        }
        const reviewId = searchParams.get('reviewId');
        if (!reviewId) {
            logger.warn("Review Id is required");
            return failResponse({ message: "Review Id is required" }, 400, undefined, undefined, true);
        }

        const deletedReview = await Review.findByIdAndDelete(reviewId).select("rating").session(session);
        if (!deletedReview) {
            await session.abortTransaction();
            return failResponse({ message: "Review not found" }, 404, undefined, undefined, true);
        }
        if (!validateMongooseId({ courseId, reviewId })) {
            logger.error("Invalid course id or review id", { courseId, reviewId });
            return failResponse({ message: "Invalid course id or review id" }, 400, undefined, undefined, true);
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
        return successResponse({ message: "Review deleted successfully" }, 200, undefined, undefined, true);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Error deleting review:", { error: message });
        return failResponse({ message: message }, 500, undefined, undefined, true);
    } finally {
        session.endSession();

    }
}
