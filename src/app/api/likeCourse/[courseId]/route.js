import {NextResponse} from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { connectDB } from "@/config/db";
import Course from "@/models/course/courseModel";
import User from "@/models/userModel";


export async function POST (request ,context){
    await connectDB();
    try{
        const user =  await getDataFromToken(request);
        const userId = user._id || user.id;
        if(!userId){
            return NextResponse.json({message:"User id is required"},{status:400});
        }
        const userDB = await User.findById(userId); 
        if(!userDB){
            return NextResponse.json({message:"User not found"},{status:403});
        }
        const { courseId } = await context.params;
        // console.log("This is the course ID",courseId);
        // console.log("This is the user in DB",userDB);
        // console.log("These are the liked courses",userDB.likedCourses);
        if(!courseId){
            return NextResponse.json({message:"Course id is required"},{status:400});
        }
        const course = await Course.findById(courseId);
        if(!course){
            return NextResponse.json({message:"Course not found"},{status:404});
        }
        if(userDB.likedCourses.includes(courseId)) return NextResponse.json({message:"You have already liked this course"},{status:400});
        userDB.likedCourses.push(courseId);
        await userDB.save();
        return NextResponse.json({message:"Course liked successfully",course},{status:200});

    }catch(error){
        // console.log("There is a error on the server side")
        console.error(error);
        return NextResponse.json({message:"Internal Server Error"},{status:500})
    }
}


