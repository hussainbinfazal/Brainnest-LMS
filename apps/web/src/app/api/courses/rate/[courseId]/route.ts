import { NextRequest, NextResponse } from "next/server";
import { Course, User, connectDB, logger, Review,validateMongooseId } from "@repo/shared";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import mongoose from "mongoose";

export async function POST(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { courseId } = context.params;
        const user: ISessionUser | null = await getDataFromToken(request);
        if (!user || !user.id) {
            logger.error("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "You are not logged in" }, { status: 401 })
        };
        const userId: string = user.id;
        if (!validateMongooseId({ userId, courseId })) return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
        const { rating, comment } = await request.json();
        if (!rating || !comment) {
            logger.warn("rating & comment are required", { rating, comment });
            return NextResponse.json({ message: "rating & comment are required" }, { status: 400 })
        };
        const [courseDB, isReviewed] = await Promise.all([
            Course.findById(courseId).session(session),
            Review.exists({ user: userId, course: courseId }).session(session)
        ]);
        if (!courseDB) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        };
        if (isReviewed) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Already reviewed" }, { status: 400 });
        };
        
        // if(user.reviewCountInLastHour > 5){ //// maintain this with the redis
        //     await session.abortTransaction();
        //     return NextResponse.json({ message: "Too many reviews" }, { status: 400 });
        // } 
        if (comment.length < 10) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Comment must be at least 10 characters" }, { status: 400 });
        }
        if (comment.length > 2000) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Comment must be less than 2000 characters" }, { status: 400 });
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
            return NextResponse.json({ message: "Error in adding review" }, { status: 500 });
        }
        

        await session.commitTransaction();
        session.endSession();

        logger.info("Review added successfully");
        return NextResponse.json({ review: newReview, message: "Review added successfully" }, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in adding review: ${message}`);
        return NextResponse.json({ message: `Error in Adding Review : ${message}` }, { status: 500 });
    } finally {
        session.endSession();
    }
}


export async function PUT(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse> {
    await connectDB(process.env.MONGODB_URI!);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const authenticatedUser: ISessionUser | null = await getDataFromToken(request);
        if (!authenticatedUser || !authenticatedUser.id) {
            logger.info("Unauthorized access", { ip: request.ip });
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const userId: string = authenticatedUser.id;
        const { courseId } = context.params;
        if (!courseId) {
            logger.info("Course id is required");
            return NextResponse.json({ message: "Course id is required" }, { status: 400 })
        };
        if (!validateMongooseId({ userId, courseId })) {
            logger.info("Invalid course & userId", { userId, courseId });
            return NextResponse.json({ message: "Invalid course id" }, { status: 400 })
        };
        const { reviewId, rating, comment } = await request.json();

        if (
            !validateMongooseId({ reviewId }) ||
            !rating ||
            !comment ||
            rating < 1 ||
            rating > 5
        ) {
            return NextResponse.json(
                { message: "Invalid review data" },
                { status: 400 }
            );
        }
        const oldReview = await Review.findOne({
            _id: reviewId,
            user: userId,
            course: courseId,
        }).session(session);

        if (!oldReview) {
            await session.abortTransaction();
            return NextResponse.json(
                { message: "Review not found" },
                { status: 404 }
            );
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
            return NextResponse.json({ message: "Error in updating review" }, { status: 500 });
        }

        // update review
        
        await session.commitTransaction();
        session.endSession();
        logger.info("Review updated successfully");
        return NextResponse.json({ message: "Review updated successfully", review: updatedReview }, { status: 200 });
    } catch (error: any) {
        await session.abortTransaction();
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.info("Error in updating review", { message });
        return NextResponse.json({ message: `Error in Updating Review : ${message}` }, { status: 500 });
    } finally {
        session.endSession();
    }
}