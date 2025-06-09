import { NextResponse } from "next/server";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { v4 as uuidv4 } from 'uuid';




export async function POST(request, context) {
    try {
        await connectDB();
        const user = await getDataFromToken(request);
        const { reviewData } = await request.json();
        const { rating, comment } = reviewData;
        // console.log("This is the rating :",rating ,"This is the comment :",comment)
        if (!rating) return NextResponse.json({ message: "rating & comment are required" }, { status: 400 });
        const userId = user._id || user.id;
        // console.log("This is the user Id in the backend",userId)
        const { courseId } = await context.params;
        const course = await Course.findById(courseId);
        const userInDB = await User.findById(userId);
        if (!userInDB) return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        if (!course) return NextResponse.json({ message: "Course does not exist" }, { status: 400 });
        // if (course.reviews.some((item) => item.user.toString() === userInDB._id.toString())) {
        //     return NextResponse.json({ message: "You have already reviewed this course" }, { status: 400 });
        // }

        const newReview = {
            _id: uuidv4(),
            rating,
            comment,
            user: userInDB._id,
            createdAt: new Date().toISOString(),
        };
        course.reviews.push(newReview);
        await course.save();
        return NextResponse.json(newReview, { message: "Review added successfully" }, { status: 200 });

    } catch (error) {
        console.log("There is a error on the server side", error)
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}


export async function PUT(request, context) {
    try {
        await connectDB();
        const user = getDataFromToken(request);
        const userId = user.id || user._id;
        if (!user || !userId) return NextResponse.json({ message: "You are not logged in" }, { status: 401 });
        const { courseId } = await context.params;
        const { reviewData } = await request.json();
        if (!reviewData || !courseId) return NextResponse.json({ message: "Review data and courseId is required" }, { status: 400 });
        const course = await Course.findById(courseId);
        if (!course) return NextResponse.json({ message: "Course not found" }, { status: 400 });
        const review = course.reviews.find((item) => item._id === userId);
        if (!review) return NextResponse.json({ message: "You have not reviewed this course" }, { status: 400 });
        review.rating = reviewData.rating;
        review.comment = reviewData.comment;
        review.updatedAt = new Date().toISOString();
        await course.save();
        return NextResponse.json({ message: "Review updated successfully", course }, { status: 200 });
    } catch (error) {
        console.log("There is some error on the server side ", error);
        return NextResponse.json({ message: "There is a error on the server side" }, { status: 500 });
    }
}