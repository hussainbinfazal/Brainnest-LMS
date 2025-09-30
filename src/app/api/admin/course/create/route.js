import { NextResponse } from "next/server";
import Course from "@/models/course/courseModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { v4 as uuidv4 } from 'uuid';


export async function POST(request) {
    await connectDB();
    try {
        const { title, description, price, category, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount,topics

        } = await request.json();
        if (title === "" || description === "" || price === "" || category === "" || faq === "" || requirements === "" || whatYouWillLearn === "" || video === "" || lessons === "" || coverImage === "" || status === "" || duration === "" || language === "" || level === "" || certificate === "" || tags === "", discount === "") {
            return NextResponse.json({ message: "All fields are required", title, description, price, category, faq, requirements, whatYouWillLearn, video, lessons, coverImage, status, duration, language, level, certificate, tags, discount }, { status: 400 });
        }
        const user = await getDataFromToken(request);
        console.log("This is the user in the controller ", user);
        const userId = user._id || user.id;
        const parseDuration = (timeStr) => {
            if (typeof timeStr !== 'string') {
                return typeof timeStr === 'number' ? timeStr : 0;
            }

            const parts = timeStr.split(':').map(Number);
            if (parts.length === 3) {
                const [hours, minutes, seconds] = parts;
                return hours * 3600 + minutes * 60 + seconds;
            } else if (parts.length === 2) {
                const [minutes, seconds] = parts;
                return minutes * 60 + seconds;
            } else if (parts.length === 1) {
                return Number(parts[0]);
            }
            return 0;
        };
        console.log("This is the userId", userId);
        const course = new Course({
            title,
            description,
            price,
            category,
            faq,
            requirements,
            whatYouWillLearn,
            video,
            lessons: lessons.map((lesson) => ({
                ...lesson,
                duration: parseDuration(lesson.duration),// Convert to Number
                _id: uuidv4()
            })),
            coverImage,
            status,
            discount,
            duration: parseDuration(duration),
            language,
            level,
            certificate,
            tags,
            instructor: userId,
            topics
        });

        await course.save();
        return NextResponse.json({ message: "Course created successfully", course }, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error creating course" }, { status: 500 });
    }

}