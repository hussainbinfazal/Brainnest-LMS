import { NextResponse } from 'next/server'
import { connectDB } from "@/config/db";
import Course from "@/models/courseModel";
import { getDataFromToken } from "@/utils/getDataFromToken";
import mongoose from 'mongoose';


export async function GET(request) {
    await connectDB();
    try {
        const user = await getDataFromToken(request);
        if (!user) return NextResponse.json({ message: "You are not logged in" }, { status: 401 });
        const userId = user._id || user.id;
        if (!userId) return NextResponse.json({ message: "User id is required" }, { status: 400 });
        const myCourses = await Course.find({
            'enrolledStudents': { $in: [new mongoose.Types.ObjectId(userId)] }
        }).lean()
        // console.log("These are my courses in the backend", myCourses);
        if (!myCourses) return NextResponse.json({ message: "No courses found" }, { status: 400 });
        return NextResponse.json(myCourses, { status: 200 });

    } catch (error) {
        console.log("This is the error on the backend", error)
        return NextResponse.json({ error: "intenrnal server error" }, { status: 500 })
    }

}