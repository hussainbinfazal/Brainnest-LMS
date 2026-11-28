import {
  failResponse,
  successResponse,
} from "@/lib/helpers/failResponseHelper";
import { NextRequest, NextResponse } from "next/server";
import { Course, User, connectDB } from "@repo/shared/server";
import { CustomNextRequest, ISessionUser } from "../../../../types/server";
import {
  checkIp,
  CERTIFICATE_IP_KEY,
  ICertificate,
  ICourse,
  IProgress,
  IUser,
  logger,
  Progress,
  Certificate,
  validateMongooseId,
} from "@repo/shared/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
import UserCourse from "@repo/shared/models/User/userCourse";

export async function GET(
  request: CustomNextRequest,
  context: { params: Promise<{ courseId: string | string[] }> }
): Promise<NextResponse | Response> {
  const { allowed, retryAfterSec, ip } = await checkIp(
    request,
    CERTIFICATE_IP_KEY.namespace,
    CERTIFICATE_IP_KEY.max,
    CERTIFICATE_IP_KEY.windowSec
  );
  if (!allowed)
    return failResponse(
      { message: "Too many requests" },
      429,
      undefined,
      { "Retry-After": String(retryAfterSec) },
      true
    );
  try {
    await connectDB(process.env.MONGODB_URI!);
    const authSession: Session | null = await auth();
    if (!authSession)
      return failResponse(
        { message: "Unauthorized", ip: ip },
        401,
        undefined,
        undefined,
        true
      );
    const user: ISessionUser | null = authSession?.user;
    const params = await context.params;
    const courseId: string = Array.isArray(params.courseId)
      ? params.courseId[0]
      : params.courseId;
    if (!user || !user.id) {
      logger.info("Unauthorized access", { ip: ip });
      return failResponse(
        { message: "Unauthorized", ip: ip },
        401,
        undefined,
        undefined,
        true
      );
    }
    const userId: string = user.id;
    if (!courseId || !validateMongooseId({ userId, courseId }))
      return failResponse(
        { message: "Invalid course id" },
        400,
        undefined,
        undefined,
        true
      );

    const [userCourse, courseDB, userDB] = await Promise.all([
      UserCourse.find({ userId: userId, courseId: courseId, isEnrolled: { $ne: { isEnrolled: false } } }).lean().exec(),
      Course.findById(courseId)
        .select("instructorId title")
        .populate("instructorId", "name")
        .lean(),
      User.findById(userId).select("name").lean().exec(),
    ]);
    if (!userCourse.isEnrolled || !courseDB || !userDB) {
      logger.warn("Invalid attempt to create certificate")
      return failResponse({ message: "Please enroll in this course" }, 401, undefined, undefined, true)
    };

    // Optional: check if user completed course
    const userProgress: IProgress | null = await Progress.findOne({
      userId: userId,
      courseId: courseId,
    });
    const isCompleted: boolean | undefined =
      userCourse.isCompleted ? userProgress?.percentageCompleted === 100 ? true : false : false;
    if (!isCompleted) {
      return failResponse(
        {
          message:
            "Course not completed, please complete your pending lessons first",
        },
        403,
        undefined,
        undefined,
        true
      );
    }

    const existingCertificate: ICertificate | null = await Certificate.findOne({
      userId: userId,
      courseId: courseId,
    });

    if (!existingCertificate) {
      return failResponse(
        { message: "No Certificate Found" },
        400,
        undefined,
        undefined,
        true
      );
    }
    return successResponse(
      {
        message: "This is the certificate",
        certificateUrl: existingCertificate.pdfUrl,
      },
      200,
      undefined,
      undefined,
      true
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error in generating certificate", { error });
    return failResponse(
      { message: `Error in Generating Certificate: ${message}` },
      500,
      undefined,
      undefined,
      true
    );
  }
}
