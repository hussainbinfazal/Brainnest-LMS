

import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Course from "@/models/courseModel";
import User from "@/models/userModel";
import { getDataFromToken } from "@/utils/getDataFromToken";

export async function GET(request) {
    await connectDB();
    try {
        const user = await getDataFromToken(request);
        console.log("User in the admin all course route", user);
        if (!user) {
            return NextResponse.json({ message: "You are not authorized to acces this route" }, { status: 401 })
        }
        const userIdOfInstructor = user._id || user.id;
        const courses = await Course.find({ instructor: userIdOfInstructor })
            .populate("instructor", "name email")
            .populate("enrolledStudents.user", "_id name email profileImage role").lean();
        return NextResponse.json({ courses }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Something went wrong on the server side" }, { status: 500 })
    }
}