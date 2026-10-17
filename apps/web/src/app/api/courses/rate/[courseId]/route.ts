import { failResponse, successResponse } from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { checkIp, COURSE_RATING_IP_KEY, Course, User, connectDB, logger, Review, validateMongooseId } from '@repo/shared/server';
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";

const createReviewBodySchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string(),
});
const updateReviewBodySchema = z.object({
    reviewId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string(),
});

export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_RATING_IP_KEY.namespace, COURSE_RATING_IP_KEY.max, COURSE_RATING_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { courseId } = context.params;
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const user: ISessionUser | null = authSession?.user;
        if (!user || !user.id) {
            logger.error("Unauthorized access", { ip: ip });
            return failResponse({ message: "You are not logged in" }, 401, undefined, undefined, true)
        };
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId })) return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true);
        const body = await parseBody(request, createReviewBodySchema);
        if (!body.ok) return body.response;
        const { rating, comment } = body.data;
        if (!rating || !comment) {
            logger.warn("rating & comment are required", { rating, comment });
            return failResponse({ message: "rating & comment are required" }, 400, undefined, undefined, true)
        };
        const [courseDB, isReviewed] = await Promise.all([
            Course.findById(courseId).session(session),
            Review.exists({ user: userId, course: courseId }).session(session)
        ]);
        if (!courseDB) {
            await session.abortTransaction();
            return failResponse({ message: "Course not found" }, 404, undefined, undefined, true);
        };
        if (isReviewed) {
            await session.abortTransaction();
            return failResponse({ message: "Already reviewed" }, 400, undefined, undefined, true);
        };

        // if(user.reviewCountInLastHour > 5){ //// maintain this with the redis
        //     await session.abortTransaction();
        //     return NextResponse.json({ message: "Too many reviews" }, { status: 400 });
        // } 
        if (comment.length < 10) {
            await session.abortTransaction();
            return failResponse({ message: "Comment must be at least 10 characters" }, 400, undefined, undefined, true);
        }
        if (comment.length > 2000) {
            await session.abortTransaction();
            return failResponse({ message: "Comment must be less than 2000 characters" }, 400, undefined, undefined, true);
        }
        const [newReview, updatedCourse] = await Promise.all([
            Review.create(
                [
                    {
                        user: userId,
                        course: courseId,
                        rating,
                        comment,
                    },
                ],
                { session }
            ),
            Course.updateOne(
                { _id: courseId },
                {
                    $inc: {
                        totalReviews: 1,
                        totalRatingSum: rating,
                        [`ratingDistribution.${rating - 1}`]: 1,
                    },
                },
                { session }
            )
        ]);

        if (!newReview || !updatedCourse) {
            await session.abortTransaction();
            return failResponse({ message: "Error in adding review" }, 500, undefined, undefined, true);
        }


        await session.commitTransaction();
        session.endSession();

        logger.info("Review added successfully");
        return successResponse({ review: newReview, message: "Review added successfully" }, 200, undefined, undefined, true);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in adding review: ${message}`);
        return failResponse({ message: `Error in Adding Review : ${message}` }, 500, undefined, undefined, true);
    } finally {
        session.endSession();
    }
}


export async function PUT(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    const { allowed, retryAfterSec, ip } = await checkIp(request, COURSE_RATING_IP_KEY.namespace, COURSE_RATING_IP_KEY.max, COURSE_RATING_IP_KEY.windowSec);
    if (!allowed) return failResponse({ message: "Too many requests" }, 429, undefined, { "Retry-After": String(retryAfterSec) }, true);
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const authSession: Session | null = await auth()
        if (!authSession) return failResponse({ message: "Unauthorized", ip: ip }, 401, undefined, undefined, true);
        const authenticatedUser: ISessionUser | null = authSession?.user;
        if (!authenticatedUser || !authenticatedUser.id) {
            logger.info("Unauthorized access", { ip: ip });
            return failResponse({ message: "Unauthorized" }, 401, undefined, undefined, true);
        }
        const userId: string = authenticatedUser.id;
        const { courseId } = context.params;
        if (!courseId) {
            logger.info("Course id is required");
            return failResponse({ message: "Course id is required" }, 400, undefined, undefined, true)
        };
        if (!validateMongooseId({ userId, courseId })) {
            logger.info("Invalid course & userId", { userId, courseId });
            return failResponse({ message: "Invalid course id" }, 400, undefined, undefined, true)
        };
        const body = await parseBody(request, updateReviewBodySchema);
        if (!body.ok) return body.response;
        const { reviewId, rating, comment } = body.data;

        if (
            !validateMongooseId({ reviewId }) ||
            !rating ||
            !comment ||
            rating < 1 ||
            rating > 5
        ) {
            return failResponse({ message: "Invalid review data" }, 400, undefined, undefined, true);
        }
        const oldReview = await Review.findOne({
            _id: reviewId,
            user: userId,
            course: courseId,
        }).session(session);

        if (!oldReview) {
            await session.abortTransaction();
            return failResponse({ message: "Review not found" }, 404, undefined, undefined, true);
        }

        const ratingDiff = rating - oldReview.rating;
        const [updatedReview, updatedCourse] = await Promise.all([
            Review.findByIdAndUpdate(
                reviewId,
                { rating, comment },
                { new: true, session }
            ),
            Course.updateOne(
                { _id: courseId },
                {
                    $inc: {
                        totalRatingSum: ratingDiff,
                        [`ratingDistribution.${oldReview.rating - 1}`]: -1,
                        [`ratingDistribution.${rating - 1}`]: 1,
                    },
                },
                { session }
            )
        ]);

        if (!updatedReview || !updatedCourse) {
            await session.abortTransaction();
            return failResponse({ message: "Error in updating review" }, 500, undefined, undefined, true);
        }

        // update review

        await session.commitTransaction();
        session.endSession();
        logger.info("Review updated successfully");
        return successResponse({ message: "Review updated successfully", review: updatedReview }, 200, undefined, undefined, true);
    } catch (error: any) {
        await session.abortTransaction();
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.info("Error in updating review", { message });
        return failResponse({ message: `Error in Updating Review : ${message}` }, 500, undefined, undefined, true);
    } finally {
        session.endSession();
    }
}