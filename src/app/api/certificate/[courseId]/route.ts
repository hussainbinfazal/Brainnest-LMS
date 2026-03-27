
import jsPDF from "jspdf";
import { NextRequest, NextResponse } from "next/server";
import Course from "@/models/Course/courseModel";
import User from "@/models/User/userModel";
import { connectDB } from "@/config/mongoDB/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { CustomNextRequest, ISessionUser } from "../../../../types/server";
import { ICertificate, ICourse, IProgress, IUser } from "@/types/model";
import { logger } from "@/utils/logger/logger";
import Progress from "@/models/Course/progressModel";
import Certificate from "@/models/Course/certificateModel";
import { validateMongooseId } from "@/utils/schemaValidation/idValidator/idValidator";

export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse | Response> {
  try {
    await connectDB();
    const user: ISessionUser | null = await getDataFromToken(request);
    const { courseId } = context.params;
    if (!user || !user.id) {
      logger.info("Unauthorized access", { ip: request.ip });
      return NextResponse.json({ message: "Unauthorized", ip: request.ip }, { status: 401 })
    }
    const userId: string = user.id;
    if (!courseId || !validateMongooseId({userId, courseId})) return NextResponse.json({ message: "Invalid course id" }, { status: 400 });

    const [courseDB, userDB,] = await Promise.all([
      Course.findById(courseId)
        .select("instructorId title")
        .populate("instructorId", "name")
        .lean(),
      User.findById(userId)
        .select("name")
        .lean()
    ])

    if (!courseDB || !userDB) {
      logger.warn("User or Course not found in certificate route", {
        user: userDB ? userDB : null,
        course: courseDB ? courseDB : null,
      });
      return NextResponse.json({ message: "User or Course not found" }, { status: 404 });
    }

    // Optional: check if user completed course
    const userProgress: IProgress | null = await Progress.findOne({
      userId: userId,
      courseId: courseId
    });
    const isCompleted: boolean | undefined
      = userProgress?.percentageCompleted === 100 ? true : false;

    if (!isCompleted) {
      return NextResponse.json({ message: "Course not completed, please complete your pending lessons first" }, { status: 403 });
    }

    const existingCertificate: ICertificate | null = await Certificate.findOne({
      userId: userId,
      courseId: courseId
    })

    if (!existingCertificate) {
      return NextResponse.json({ message: "No Certificate Found" }, { status: 400 });
    }
    return NextResponse.json({ message: "This is the certificate", certificateUrl: existingCertificate.pdfUrl }, { status: 200 });
  } catch (error: any) {
    logger.error("Error in generating certificate", { error });
    console.error("Certificate generation error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: `Error in Generating Certificate: ${message}` }, { status: 500 });
  }
}