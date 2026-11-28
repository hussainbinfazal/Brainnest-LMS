import {
  failResponse,
  successResponse,
} from "@/lib/helpers/failResponseHelper";
import {
  checkIp,
  Lesson,
  LessonProgress,
  LessonProgressStatus,
  Progress,
  PROGRESS_BY_USER_COURSE,
  PROGRESS_LESSON_IP_KEY,
  USER_COURSE_DETAIL,
  USER_COURSE_LIST,
  connectDB,
  logger,
  userCourse as UserCourse,
  passJobToWorker,
  User,
} from "@repo/shared/server";
import { invalidateCached } from "@repo/shared/config/redisConfig/cache-helper";
import { CustomNextRequest, ISessionUser } from "@/types/server";
import { validateMongooseId } from "@/utils/fieldsValidation/idValidator/idValidator";

import { Session } from "next-auth";
import { auth } from "@/auth";
import { parseBody } from "@/lib/helpers/bodyValidatoryHelper";
import { z } from "zod";
import { NextResponse } from "next/server";
import { workerApiLinks } from "@/utils/workerApiLinks";
import { getCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import { getUserByIdWithCache } from "@/lib/non-Admin-Cached/getCachedUser";

const updateProgressBodySchema = z.object({
  progressValue: z.number().min(0).max(100),
  lastPositionSeconds: z.number().min(0),
});

async function recomputeCourseProgress(userId: string, courseId: string,) {
  const now = new Date();
  //All non deleted lessons of the course
  const courseLessons = await Lesson.find({ courseId, isDeleted: { $ne: true } })
    .select('_id')
    .lean()
    .exec();
  const savedUser = await getUserByIdWithCache(userId)
  const course = await getCourseByIdWithCache(courseId);
  if (!course && !savedUser) {
    throw new Error("course not found")
    return
  }
  const courseLessonIds = courseLessons.map(({ _id }) => _id);
  const rows = await LessonProgress.find({ userId, courseId, lessonId: { $in: courseLessonIds } })
    .select('lessonId status progressPercentage')
    .lean()
    .exec()
  const byLessonId = new Map<string, (typeof rows)[number]>();

  ///Fill the map
  for (const row of rows) {
    byLessonId.set(row.lessonId.toString(), row);
  };

  //Index rows by lessonId for O(1) lookup
  let total = 0;
  let completedLessonsCount = 0;
  for (const courseLesson of courseLessons) {
    const row = byLessonId.get(courseLesson._id.toString());
    if (row?.status === LessonProgressStatus.Completed) {
      completedLessonsCount += 1;
      //Add a full lesson
      total += 100;
    } else {
      total += row?.progressPercentage ?? 0;
    }
  }

  const isCourseCompleted = courseLessons.length > 0 && completedLessonsCount === courseLessons.length;
  if (isCourseCompleted) {
    await passJobToWorker(
      workerApiLinks.certificate.generateCertificate,
      {
        userName: savedUser!.username,
        courseId: courseId,
        userId: userId,
        instructorName: course!.instructorId!.name,
        courseTitle: course!.title
      }
    );

  }
  // Cap at 99 until truly complete, so rounding never shows 100 early
  const courseProgress = isCourseCompleted ? 100 : courseLessons.length > 0
    ? Math.min(99, Math.floor(total / courseLessons.length)) : 0
  // Keep the first completion date if there already is one
  const existing = await UserCourse.findOne({ userId, courseId }).lean().exec();
  ///Null when incomplete
  const completedAt = isCourseCompleted ? (existing?.completedAt ?? now) : null;

  // Two independent writes, run in parallel
  await Promise.all([
    Progress.findOneAndUpdate(
      { userId, courseId },
      { $set: { completedLessonsCount, percentageCompleted: courseProgress, lastAccessedAt: now } },
      { upsert: true, returnDocument: 'after' }
    ).lean().exec(),
    UserCourse.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          progress: courseProgress, isCompleted: isCourseCompleted, completedAt
        }
      }
    ).lean().exec()
  ])


  await Promise.all([
    invalidateCached(PROGRESS_BY_USER_COURSE.namespace, `${userId}:${courseId}`),
    invalidateCached(USER_COURSE_DETAIL.namespace, `${userId}: ${courseId}`),
    invalidateCached(USER_COURSE_LIST.namespace, userId)
  ]);

  return { courseProgress, completedLessonsCount, totalLessons: courseLessons.length, isCourseCompleted }
};

export async function POST(
  request: CustomNextRequest,
  context: {
    params: Promise<{
      courseId: string | string[];
      lessonId: string | string[];
    }>;
  }
): Promise<NextResponse> {
  const { allowed, retryAfterSec, ip } = await checkIp(
    request,
    PROGRESS_LESSON_IP_KEY.namespace,
    PROGRESS_LESSON_IP_KEY.max,
    PROGRESS_LESSON_IP_KEY.windowSec
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
    const params = await context.params;
    const courseId = Array.isArray(params.courseId)
      ? params.courseId[0]
      : params.courseId;
    const lessonId = Array.isArray(params.lessonId)
      ? params.lessonId[0]
      : params.lessonId;

    const authSession: Session | null = await auth();
    if (!authSession?.user)
      return failResponse(
        { message: "Unauthorized", ip: ip },
        401,
        undefined,
        undefined,
        true
      );
    if (!validateMongooseId({ courseId, lessonId })) {
      return failResponse({ message: "Invalid course or lesson Id" }, 400);
    }
    const parsedBody = await parseBody(request, updateProgressBodySchema);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }
    const { progressValue, lastPositionSeconds } = parsedBody.data;
    const user: ISessionUser | null = authSession?.user;
    if (!user || !user.id) {
      logger.info("Unauthorized access", { ip: ip });
      return failResponse(
        { message: "Unauthorized" },
        401,
        undefined,
        undefined,
        true
      );
    };
    const userId: string = user.id;
    if (!validateMongooseId({ userId, courseId, lessonId })) {
      logger.info("Invalid IDs", { userId, courseId, lessonId });
      return failResponse(
        { message: "Invalid IDs" },
        400,
        undefined,
        undefined,
        true
      );
    }

    await connectDB(process.env.MONGODB_URI!);

    ///Only enrolled Users may write progress 
    const isEnrolled = await UserCourse.exists({ userId, courseId }).lean().exec();
    if (!isEnrolled) {
      return failResponse({ message: "Not enrolled in this course" }, 403, undefined, undefined, true)
    }
    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId,
      isDeleted: { $ne: true },
    })
      .select("_id sectionId")
      .lean()
      .exec();
    if (!lesson) {
      return failResponse(
        { message: "Lesson not found in this course" },
        404,
        undefined,
        undefined,
        true
      );
    }

    const now = new Date();
    const lessonProgressUpdate =
      progressValue >= 100
        ? {
          $set: {
            sectionId: lesson.sectionId,
            lastPositionSeconds,
            status: LessonProgressStatus.Completed,
          },
          $max: { progressPercentage: progressValue },
          $min: { completedAt: now },
        }
        : {
          $set: {
            sectionId: lesson.sectionId,
            lastPositionSeconds,
          },
          $max: { progressPercentage: progressValue },
          $setOnInsert: { status: LessonProgressStatus.InProgress },
        };
    if (progressValue >= 100)

      await LessonProgress.findOneAndUpdate(
        { userId, courseId, lessonId },
        lessonProgressUpdate,
        { upsert: true, returnDocument: 'after', runValidators: true }
      ).exec();

    ///Hearbeat Path
    if (progressValue < 100) {
      return successResponse({ message: "Progress saved" }, 200, undefined, undefined, true)
    };
    const summary = await recomputeCourseProgress(userId, courseId)
    logger.info("Lesson completed", { userId, courseId, lessonId, ...summary });
    return successResponse({ message: "Progress updated", ...summary }, 200, undefined, undefined, true)
    // const courseLessons = await Lesson.find({
    //   courseId,
    //   isDeleted: { $ne: true },
    // })
    //   .select("_id")
    //   .lean()
    //   .exec();
    // const courseLessonIds = courseLessons.map(({ _id }) => _id);
    // const lessonProgressRows = await LessonProgress.find({
    //   userId,
    //   courseId,
    //   lessonId: { $in: courseLessonIds },
    // })
    //   .select("lessonId status progressPercentage")
    //   .lean()
    //   .exec();
    // const progressByLessonId = new Map<
    //   string,
    //   (typeof lessonProgressRows)[number]
    // >();
    // for (const row of lessonProgressRows) {
    //   progressByLessonId.set(row.lessonId.toString(), row);
    // }

    // let totalLessonProgress = 0;
    // let completedLessonsCount = 0;
    // for (const courseLesson of courseLessons) {
    //   const lessonProgress = progressByLessonId.get(
    //     courseLesson._id.toString()
    //   );
    //   if (lessonProgress?.status === LessonProgressStatus.Completed) {
    //     completedLessonsCount += 1;
    //     totalLessonProgress += 100;
    //   } else {
    //     totalLessonProgress += lessonProgress?.progressPercentage ?? 0;
    //   }
    // }

    // const isCourseCompleted =
    //   courseLessons.length > 0 &&
    //   completedLessonsCount === courseLessons.length;
    // const courseProgress = isCourseCompleted
    //   ? 100
    //   : courseLessons.length > 0
    //     ? Math.min(
    //       99,
    //       Math.floor(totalLessonProgress / courseLessons.length)
    //     )
    //     : 0;
    // const existingUserCourse = await UserCourse.findOne({
    //   userId,
    //   courseId,
    // })
    //   .select("completedAt")
    //   .lean()
    //   .exec();
    // const completedAt = isCourseCompleted
    //   ? existingUserCourse?.completedAt ?? now
    //   : null;

    // await Promise.all([
    //   Progress.findOneAndUpdate(
    //     { userId, courseId },
    //     {
    //       $set: {
    //         completedLessonsCount,
    //         percentageCompleted: courseProgress,
    //         lastAccessedAt: now,
    //       },
    //     },
    //     { upsert: true, new: true }
    //   ).lean().exec(),
    //   UserCourse.findOneAndUpdate(
    //     { userId, courseId },
    //     {
    //       $set: {
    //         progress: courseProgress,
    //         isCompleted: isCourseCompleted,
    //         completedAt,
    //       },
    //     },
    //     { upsert: true, new: true }
    //   ).lean().exec(),
    // ]);

    // await Promise.all([
    //   invalidateCached(
    //     PROGRESS_BY_USER_COURSE.namespace,
    //     `${userId}: ${courseId}`
    //   ),
    //   invalidateCached(
    //     USER_COURSE_DETAIL.namespace,
    //     `${userId} - ${courseId}`
    //   ),
    //   invalidateCached(USER_COURSE_LIST.namespace, userId),
    // ]);
    // logger.info("Progress saved successfully", {
    //   userId,
    //   courseId,
    //   lessonId,
    //   courseProgress,
    //   isCourseCompleted,
    // });
    // return successResponse(
    //   {
    //     message: "Progress updated",
    //     courseProgress,
    //     completedLessonsCount,
    //     totalLessons: courseLessons.length,
    //     isCourseCompleted,
    //   },
    //   200,
    //   undefined,
    //   undefined,
    //   true
    // );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to save progress:${message}", { message });
    return failResponse(
      { message: `Failed to save progress: ${message}` },
      500,
      undefined,
      undefined,
      true
    );
  }
}
