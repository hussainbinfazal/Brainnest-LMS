import { getClientIp } from "@repo/shared/utils/getClientIp";

import { NextRequest, NextResponse } from "next/server";
import { Course, User, connectDB } from "@repo/shared";
import { CustomNextRequest, ISessionUser } from "../../../../types/server";
import { ICertificate, ICourse, IProgress, IUser, logger, Progress, Certificate, validateMongooseId } from "@repo/shared";
import { auth } from "@/auth";
import { Session } from "next-auth";


export async function GET(request: CustomNextRequest, context: { params: { courseId: string } }): Promise<NextResponse | Response> {
    const ip = getClientIp(request.headers);
    if (ip === 'unknown') logger.warn('OTP route: could not resolve client IP');
  try {
    await connectDB(process.env.MONGODB_URI!);
    const authSession: Session | null = await auth()
    if (!authSession) return NextResponse.json({ message: "Unauthorized", ip: ip }, { status: 401 });
    const user: ISessionUser | null = authSession?.user;
    const { courseId } = context.params;
    if (!user || !user.id) {
      logger.info("Unauthorized access", { ip: ip });
      return NextResponse.json({ message: "Unauthorized", ip: ip }, { status: 401 })
    }
    const userId: string = user.id;
    if (!courseId || !validateMongooseId({ userId, courseId })) return NextResponse.json({ message: "Invalid course id" }, { status: 400 });

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Error in generating certificate", { error });
    return NextResponse.json({ message: `Error in Generating Certificate: ${message}` }, { status: 500 });
  }
}