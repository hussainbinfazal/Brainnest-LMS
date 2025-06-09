// import {NextResponse } from "next/server";
// import Course from "@/models/courseModel";
// import { connectDB } from "@/config/db";
// import { getDataFromToken } from "@/lib/jwt";






// export async function GET(request,context){
//     try{
//         await connectDB();
//         const {courseId} = await context.params;
//         const course = await Course.findById(courseId).populate("reviews").populate("reviews","user").lean();
//         if(!courseId) return NextResponse.json({message:"Course Id is required"},{status:400});
//         return NextResponse.json({message:"Reviews fetched successfully",course},{status:200});
//     }catch(error){

//     }
// }