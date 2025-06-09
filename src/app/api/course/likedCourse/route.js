import { NextResponse } from "next/server";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";

export async function GET(request, context) {
    await connectDB();
    try {
        console.log("Fetched Liked Courses called in backend")
        const user = await getDataFromToken(request);
        const userId = user._id || user.id;
        const userInDb = await User.findById(userId)
            .populate({
                path: "likedCourses",
                populate: {
                    path: "instructor",
                    select: "name _id profileImage",
                },
            })
            .lean(); const userLikedCourses = userInDb.likedCourses
        // console.log("This is the user in DB", userInDb);
        if (!userLikedCourses) return NextResponse.json({ message: "No Liked Courses" });
        return NextResponse.json(userLikedCourses);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error Fetching courses" });

    }
};