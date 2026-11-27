import { JSX } from "react/jsx-runtime";
import { LeesonIdPageComp } from "@/app/components/CourseIDComp/LessonIDComp/LessonIDComp";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { logger, validateMongooseId } from "@repo/shared/server";
import { getCourseByIdWithCache } from "@/lib/non-Admin-Cached/getCachedCourse";
import { getLessonsByIdWithCache } from "@/lib/non-Admin-Cached/getCachedLessons";
import { getUserProgressByIdWithCache } from "@/lib/non-Admin-Cached/getCachedUserProgress";

// Render a YouTube video player
export async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<JSX.Element> {
  const { courseId, lessonId } = await params;
  const session: Session | null = await auth()
  if (!session?.user) {
    logger.warn("Unauthorized")
    return redirect('/')
  }
  if (!courseId || !lessonId || !validateMongooseId({ courseId, lessonId })) {
    logger.warn("Invalid course id")
    return redirect('/')
  }
  const [course, lessons, userProgress] = await Promise.all([
    getCourseByIdWithCache(courseId),
    getLessonsByIdWithCache(courseId),
    session.user.id
      ? getUserProgressByIdWithCache(session.user.id, courseId)
      : Promise.resolve(null),
  ]);

  if (!course || !lessons) {
    logger.error("Course not found", { courseId })
    return redirect('/')
  }
  const lesson = lessons.find((l) => l._id === lessonId);
  if (!lesson) {
    logger.warn("Lesson not found", { courseId, lessonId });
    return redirect("/");
  }
  const lessonProgress =
    userProgress?.lessons.find((progress) => progress.lessonId === lessonId) ??
    null;
  return (
    <LeesonIdPageComp
      //This is current course.
      renderedCourse={course}
      //This is all lessons in this particular course.
      renderedLessons={lessons}
      ///this is the current that user is watching right now.
      lesson={lesson}
      //This is the progress of the current lesson here at this.
      lessonProgress={lessonProgress}
    />
  );
};

export default LessonPage;
